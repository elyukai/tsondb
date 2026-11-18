import { on } from "@elyukai/utils/function"
import { isNotNullish, mapNullable } from "@elyukai/utils/nullable"
import { toCamelCase } from "@elyukai/utils/string"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { ENUM_DISCRIMINATOR_KEY } from "../../../shared/schema/declarations/EnumDecl.ts"
import { NodeKind } from "../../../shared/schema/Node.ts"
import { type Decl, asDecl } from "../../schema/dsl/declarations/Decl.ts"
import {
  type EntityDecl,
  isEntityDeclWithParentReference,
} from "../../schema/dsl/declarations/EntityDecl.ts"
import { type EnumDecl, isEnumDecl } from "../../schema/dsl/declarations/EnumDecl.ts"
import {
  type SingletonEntityDecl,
  isSingletonEntityDecl,
} from "../../schema/dsl/declarations/SingletonEntityDecl.ts"
import { TypeAliasDecl } from "../../schema/dsl/declarations/TypeAliasDecl.ts"
import type { EnumCaseDecl, Type } from "../../schema/dsl/index.ts"
import type { ArrayType } from "../../schema/dsl/types/ArrayType.ts"
import type { BooleanType } from "../../schema/dsl/types/BooleanType.ts"
import {
  type ChildEntitiesType,
  isChildEntitiesType,
} from "../../schema/dsl/types/ChildEntitiesType.ts"
import type { DateType } from "../../schema/dsl/types/DateType.ts"
import type { EnumType } from "../../schema/dsl/types/EnumType.ts"
import type { FloatType } from "../../schema/dsl/types/FloatType.ts"
import type { IncludeIdentifierType } from "../../schema/dsl/types/IncludeIdentifierType.ts"
import type { IntegerType } from "../../schema/dsl/types/IntegerType.ts"
import {
  type NestedEntityMapType,
  isNestedEntityMapType,
} from "../../schema/dsl/types/NestedEntityMapType.ts"
import {
  type MemberDecl,
  type ObjectType,
  isObjectType,
} from "../../schema/dsl/types/ObjectType.ts"
import type { ReferenceIdentifierType } from "../../schema/dsl/types/ReferenceIdentifierType.ts"
import type { StringType } from "../../schema/dsl/types/StringType.ts"
import {
  type TranslationObjectType,
  isTranslationObjectType,
} from "../../schema/dsl/types/TranslationObjectType.ts"
import type { TypeArgumentType } from "../../schema/dsl/types/TypeArgumentType.ts"
import { flatMapAuxiliaryDecls, isFinalChildEntitiesType } from "../../schema/helpers.ts"
import type { Schema } from "../../schema/index.ts"
import * as AST from "./ast.ts"

export type SwiftRendererOptions = {
  visibility: "public" | "internal"
  indentation: number | "tab"
  preserveFiles: boolean
  generateEntityMap: boolean
  generateEntityProtocol: boolean
  generateChildEntityProtocol: boolean
  generateCompressedDatabaseRepresentationType: boolean
  generateIdentifierPropertyForEntities: boolean
  generateDecodableConformance: Boolean
  declareConformances: Record<string, string[]>
  explicitNestedEntityMapTypes: {
    [entityName: string]: {
      comment?: string
      typeName: string
    }
  }
}

const defaultOptions: SwiftRendererOptions = {
  visibility: "internal",
  indentation: 4,
  preserveFiles: false,
  generateEntityMap: false,
  generateEntityProtocol: false,
  generateChildEntityProtocol: false,
  generateCompressedDatabaseRepresentationType: false,
  generateIdentifierPropertyForEntities: true,
  generateDecodableConformance: true,
  declareConformances: {},
  explicitNestedEntityMapTypes: {},
}

type RenderFn<T, R = AST.Type> = (options: SwiftRendererOptions, parentDecl: Decl, node: T) => R

type DeclRenderFn<T, R = AST.Declaration> = (
  options: SwiftRendererOptions,
  schema: Schema,
  node: T,
) => R

const reservedKeywords = new Set(["default", "self", "throw"])

const makeSafeIdentifier = (name: string): string =>
  reservedKeywords.has(name) ? `\`${name}\`` : name

const renderArrayType: RenderFn<ArrayType> = (options, decl, type) =>
  type.minItems !== undefined && type.minItems === type.maxItems
    ? AST.typeLiteral(
        `[${type.minItems} of ${AST.renderType(renderType(options, decl, type.items))}]`,
      ) // `(${replicate(renderType(options, decl, type.items), type.minItems).join(", ")})`
    : AST.typeLiteral(`[${AST.renderType(renderType(options, decl, type.items))}]`)

const renderObjectType: RenderFn<ObjectType<Record<string, MemberDecl>>, AST.Member[]> = (
  options,
  decl,
  type,
) =>
  Object.entries(type.properties)
    .filter(([_key, config]) => !isFinalChildEntitiesType(config.type))
    .map(([name, config]): AST.Member => {
      const safeName = makeSafeIdentifier(toCamelCase(name))
      return AST.member({
        visibility: options.visibility,
        comment: config.comment,
        isDeprecated: config.isDeprecated,
        keyword: "let",
        name: safeName,
        type: AST.optionalCond(renderType(options, decl, config.type), !config.isRequired),
      })
    })

const renderBooleanType: RenderFn<BooleanType> = (_options, _type) => AST.typeIdentifier("Bool")

const renderDateType: RenderFn<DateType> = (_options, _type) => AST.typeIdentifier("Date")

const renderFloatType: RenderFn<FloatType> = (_options, _type) => AST.typeIdentifier("Double")

const renderIntegerType: RenderFn<IntegerType> = (_options, _type) => AST.typeIdentifier("Int")

const renderStringType: RenderFn<StringType> = (_options, _type) => AST.typeIdentifier("String")

const renderTypeArgumentType: RenderFn<TypeArgumentType> = (_options, _decl, type) =>
  AST.typeIdentifier(type.argument.name)

const renderReferenceIdentifierType: RenderFn<ReferenceIdentifierType> = (_options, _decl, type) =>
  AST.typeIdentifier(`${type.entity.name}.ID`)

const renderIncludeIdentifierType: RenderFn<IncludeIdentifierType> = (options, decl, type) =>
  AST.typeIdentifier(
    type.reference.name,
    type.args.map(arg => renderType(options, decl, arg)),
  )

const renderNestedEntityMapType: RenderFn<NestedEntityMapType> = (options, _decl, type) => {
  const explicitType = options.explicitNestedEntityMapTypes[type.secondaryEntity.name]
  return explicitType !== undefined
    ? AST.typeIdentifier(explicitType.typeName, [AST.typeIdentifier(type.name)])
    : AST.typeLiteral(`[${type.secondaryEntity.name}.ID: ${type.name}]`)
}

const isIndirectEnumCase = (parentDecl: Decl, caseDef: EnumCaseDecl): boolean => {
  if (!isEnumDecl(parentDecl)) {
    return false
  }

  const aux = (type: Type): boolean => {
    switch (type.kind) {
      case NodeKind.ArrayType:
        return aux(type.items)
      case NodeKind.ObjectType:
        return Object.values(type.properties).some(prop => aux(prop.type))
      case NodeKind.ReferenceIdentifierType:
        return false
      case NodeKind.IncludeIdentifierType:
        return type.reference.name === parentDecl.name
      case NodeKind.NestedEntityMapType:
        return false
      case NodeKind.TypeArgumentType:
        return false
      default:
        return false
    }
  }

  return caseDef.type !== null && aux(caseDef.type)
}

const renderEnumType: RenderFn<EnumType, AST.EnumCase[]> = (options, decl, type) =>
  Object.entries(type.values).map(([caseName, caseDef]): AST.EnumCase => {
    const safeName = makeSafeIdentifier(toCamelCase(caseName))
    const isIndirect = isIndirectEnumCase(decl, caseDef)

    return AST.enumCase({
      comment: caseDef.comment,
      isDeprecated: caseDef.isDeprecated,
      isIndirect,
      name: safeName,
      associatedType: caseDef.type === null ? undefined : renderType(options, decl, caseDef.type),
    })
  })

const renderChildEntitiesType: RenderFn<ChildEntitiesType> = () => AST.typeIdentifier("Never")

const renderTranslationObjectType: RenderFn<TranslationObjectType, AST.Member[]> = (
  options,
  _decl,
  type,
) =>
  Object.entries(type.properties).map(([name, _config]) =>
    AST.member({
      visibility: options.visibility,
      keyword: "let",
      name: `\`${name}\``,
      type: AST.optionalCond(AST.typeIdentifier("String"), !type.allKeysAreRequired),
    }),
  )

const renderType: RenderFn<Type> = (options, decl, type) => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return renderArrayType(options, decl, type)
    case NodeKind.BooleanType:
      return renderBooleanType(options, decl, type)
    case NodeKind.DateType:
      return renderDateType(options, decl, type)
    case NodeKind.FloatType:
      return renderFloatType(options, decl, type)
    case NodeKind.IntegerType:
      return renderIntegerType(options, decl, type)
    case NodeKind.StringType:
      return renderStringType(options, decl, type)
    case NodeKind.TypeArgumentType:
      return renderTypeArgumentType(options, decl, type)
    case NodeKind.ReferenceIdentifierType:
      return renderReferenceIdentifierType(options, decl, type)
    case NodeKind.IncludeIdentifierType:
      return renderIncludeIdentifierType(options, decl, type)
    case NodeKind.NestedEntityMapType:
      return renderNestedEntityMapType(options, decl, type)
    case NodeKind.ChildEntitiesType:
      return renderChildEntitiesType(options, decl, type)
    case NodeKind.EnumType:
    case NodeKind.ObjectType:
    case NodeKind.TranslationObjectType:
      return AST.typeLiteral("<<error>>") // Object and enum types are rendered as members of the parent declaration, not as a type
    default:
      return assertExhaustive(type, "Unknown type")
  }
}

const renderEntityDecl: DeclRenderFn<EntityDecl> = (options, schema, decl) =>
  AST.struct({
    visibility: options.visibility,
    comment: decl.comment,
    isDeprecated: decl.isDeprecated,
    name: decl.name,
    constraints: [
      options.generateDecodableConformance ? AST.typeIdentifier("Decodable") : undefined,
      AST.typeIdentifier("Equatable"),
      AST.typeIdentifier("Sendable"),
      options.generateIdentifierPropertyForEntities
        ? AST.typeIdentifier("Identifiable")
        : undefined,
      options.generateEntityProtocol
        ? schema.localeEntity?.name === decl.name
          ? AST.typeIdentifier("LocaleEntity")
          : AST.typeIdentifier("GeneralEntity")
        : undefined,
      options.generateChildEntityProtocol && isEntityDeclWithParentReference(decl)
        ? AST.typeIdentifier("ChildEntity")
        : undefined,
      ...(options.declareConformances[decl.name]?.map(name => AST.typeIdentifier(name)) ?? []),
    ].filter(isNotNullish),
    declarations: [
      ...(options.generateChildEntityProtocol && isEntityDeclWithParentReference(decl)
        ? (() => {
            const parentType = decl.type.value.properties[decl.parentReferenceKey]
            return [
              AST.typealias({
                visibility: options.visibility,
                name: "ParentID",
                type:
                  parentType !== undefined
                    ? renderType(options, decl, parentType.type)
                    : AST.typeLiteral("<error>"),
              }),
              AST.member({
                visibility: options.visibility,
                keyword: "let",
                static: true,
                name: "parentId",
                type: AST.typeLiteral("KeyPath<Self, ParentID> & Sendable"),
                value: AST.raw(`\\.${makeSafeIdentifier(toCamelCase(decl.parentReferenceKey))}`),
              }),
            ]
          })()
        : []),
      AST.typealias({
        visibility: options.visibility,
        name: "ID",
        type:
          schema.localeEntity?.name === decl.name
            ? AST.typeIdentifier("String")
            : AST.typeIdentifier("UUID"),
      }),
      options.generateIdentifierPropertyForEntities
        ? AST.member({
            visibility: options.visibility,
            keyword: "let",
            name: "id",
            type: AST.typeIdentifier("ID"),
          })
        : undefined,
      ...renderObjectType(options, decl, decl.type.value),
      ...(options.generateDecodableConformance
        ? [
            AST.enumeration({
              visibility: "private",
              name: "CodingKeys",
              constraints: [AST.typeIdentifier("String"), AST.typeIdentifier("CodingKey")],
              declarations: Object.entries(decl.type.value.properties)
                .filter(([_name, config]) => !isChildEntitiesType(config.type))
                .map(([name]) =>
                  AST.enumCase({ name: makeSafeIdentifier(toCamelCase(name)), rawValue: name }),
                ),
            }),
            options.generateIdentifierPropertyForEntities
              ? AST.constructor({
                  visibility: options.visibility,
                  parameters: [
                    { first: "from", second: "decoder", type: AST.typeIdentifier("Decoder") },
                  ],
                  throws: true,
                  body: AST.raw(
                    "let container = try decoder.container(keyedBy: CodingKeys.self)",
                    "",
                    "let databaseInstanceIdKey = CodingUserInfoKey.databaseInstanceIdKey",
                    "let explicitId = if let databaseInstanceIdKey {",
                    AST.raw("decoder.userInfo[databaseInstanceIdKey] as? String"),
                    "} else {",
                    AST.raw("String?.none"),
                    "}",
                    "let derivedId = decoder.codingPath.last?.stringValue",
                    "",
                    "guard let id = explicitId ?? derivedId else {",
                    AST.raw("throw DatabaseInstanceIdDecodingError.missingIdentifierString"),
                    "}",
                    ...(schema.localeEntity?.name === decl.name
                      ? []
                      : [
                          "guard let uuid = UUID(uuidString: id) else {",
                          AST.raw("throw DatabaseInstanceIdDecodingError.invalidUUID"),
                          "}",
                        ]),
                    "",
                    `self.id = ${schema.localeEntity?.name === decl.name ? "id" : "uuid"}`,
                    ...Object.entries(decl.type.value.properties)
                      .filter(([_name, config]) => !isChildEntitiesType(config.type))
                      .map(([name, config]) => {
                        const safeName = makeSafeIdentifier(toCamelCase(name))
                        return `self.${safeName} = try container.${config.isRequired ? "decode" : "decodeIfPresent"}(${AST.renderType(renderType(options, decl, config.type))}.self, forKey: .${safeName})`
                      }),
                  ),
                })
              : undefined,
          ]
        : []),
    ].filter(isNotNullish),
  })

const renderSingletonEntityDecl: DeclRenderFn<SingletonEntityDecl> = (options, _schema, decl) =>
  AST.struct({
    visibility: options.visibility,
    comment: decl.comment,
    isDeprecated: decl.isDeprecated,
    name: decl.name,
    constraints: [
      options.generateDecodableConformance ? AST.typeIdentifier("Decodable") : undefined,
      AST.typeIdentifier("Equatable"),
      AST.typeIdentifier("Sendable"),
      ...(options.declareConformances[decl.name]?.map(name => AST.typeIdentifier(name)) ?? []),
    ].filter(isNotNullish),
    declarations: [...renderObjectType(options, decl, decl.type.value)],
  })

const renderEnumDecl: DeclRenderFn<EnumDecl> = (options, _schema, decl) =>
  AST.enumeration({
    visibility: options.visibility,
    comment: decl.comment,
    isDeprecated: decl.isDeprecated,
    name: decl.name,
    parameters: decl.parameters.map(param =>
      AST.typeParameter(
        param.name,
        [
          mapNullable(param.constraint, constraint => renderType(options, decl, constraint)),
          options.generateDecodableConformance ? AST.typeIdentifier("Decodable") : undefined,
          AST.typeIdentifier("Equatable"),
          AST.typeIdentifier("Sendable"),
        ].filter(isNotNullish),
      ),
    ),
    constraints: [
      options.generateDecodableConformance ? AST.typeIdentifier("Decodable") : undefined,
      AST.typeIdentifier("Equatable"),
      AST.typeIdentifier("Sendable"),
      ...(options.declareConformances[decl.name]?.map(name => AST.typeIdentifier(name)) ?? []),
    ].filter(isNotNullish),
    declarations: [
      ...renderEnumType(options, decl, decl.type.value),
      ...(options.generateDecodableConformance
        ? [
            AST.enumeration({
              visibility: "private",
              name: "CodingKeys",
              constraints: [AST.typeIdentifier("String"), AST.typeIdentifier("CodingKey")],
              declarations: [
                AST.enumCase({ name: "tag", rawValue: ENUM_DISCRIMINATOR_KEY }),
                ...Object.entries(decl.type.value.values).map(([name]) =>
                  AST.enumCase({ name: makeSafeIdentifier(toCamelCase(name)), rawValue: name }),
                ),
              ],
            }),
            AST.enumeration({
              visibility: "private",
              name: "Discriminator",
              constraints: [AST.typeIdentifier("String"), AST.typeIdentifier("Decodable")],
              declarations: Object.entries(decl.type.value.values).map(([name]) =>
                AST.enumCase({ name: makeSafeIdentifier(toCamelCase(name)), rawValue: name }),
              ),
            }),
            AST.constructor({
              visibility: options.visibility,
              parameters: [
                { first: "from", second: "decoder", type: AST.typeIdentifier("Decoder") },
              ],
              throws: true,
              body: AST.raw(
                "let container = try decoder.container(keyedBy: CodingKeys.self)",
                "let tag = try container.decode(Discriminator.self, forKey: .tag)",
                "switch tag {",
                ...Object.entries(decl.type.value.values).flatMap(([name, value]) => {
                  const safeName = makeSafeIdentifier(toCamelCase(name))
                  return [
                    `case .${safeName}:`,
                    AST.raw(
                      `self = .${safeName}${value.type === null ? "" : `(try container.decode(${AST.renderType(renderType(options, decl, value.type))}.self, forKey: .${safeName}))`}`,
                    ),
                  ]
                }),
                "}",
              ),
            }),
          ]
        : []),
    ],
  })

const renderTypeAliasDecl: DeclRenderFn<TypeAliasDecl> = (options, _schema, decl) =>
  isObjectType(decl.type.value)
    ? AST.struct({
        visibility: options.visibility,
        comment: decl.comment,
        isDeprecated: decl.isDeprecated,
        name: decl.name,
        parameters: decl.parameters.map(param =>
          AST.typeParameter(
            param.name,
            [
              mapNullable(param.constraint, constraint => renderType(options, decl, constraint)),
              options.generateDecodableConformance ? AST.typeIdentifier("Decodable") : undefined,
              AST.typeIdentifier("Equatable"),
              AST.typeIdentifier("Sendable"),
            ].filter(isNotNullish),
          ),
        ),
        constraints: [
          options.generateDecodableConformance ? AST.typeIdentifier("Decodable") : undefined,
          AST.typeIdentifier("Equatable"),
          AST.typeIdentifier("Sendable"),
          ...(options.declareConformances[decl.name]?.map(name => AST.typeIdentifier(name)) ?? []),
        ].filter(isNotNullish),
        declarations: [
          ...renderObjectType(options, decl, decl.type.value),
          options.generateDecodableConformance
            ? AST.enumeration({
                visibility: "private",
                name: "CodingKeys",
                constraints: [AST.typeIdentifier("String"), AST.typeIdentifier("CodingKey")],
                declarations: Object.entries(decl.type.value.properties)
                  .filter(([_name, config]) => !isChildEntitiesType(config.type))
                  .map(([name]) =>
                    AST.enumCase({ name: makeSafeIdentifier(toCamelCase(name)), rawValue: name }),
                  ),
              })
            : undefined,
        ].filter(isNotNullish),
      })
    : isTranslationObjectType(decl.type.value)
      ? AST.struct({
          visibility: options.visibility,
          comment: decl.comment,
          isDeprecated: decl.isDeprecated,
          name: decl.name,
          parameters: decl.parameters.map(param =>
            AST.typeParameter(
              param.name,
              [
                mapNullable(param.constraint, constraint => renderType(options, decl, constraint)),
                options.generateDecodableConformance ? AST.typeIdentifier("Decodable") : undefined,
                AST.typeIdentifier("Equatable"),
                AST.typeIdentifier("Sendable"),
              ].filter(isNotNullish),
            ),
          ),
          constraints: [
            options.generateDecodableConformance ? AST.typeIdentifier("Decodable") : undefined,
            AST.typeIdentifier("Equatable"),
            AST.typeIdentifier("Sendable"),
            ...(options.declareConformances[decl.name]?.map(name => AST.typeIdentifier(name)) ??
              []),
          ].filter(isNotNullish),
          declarations: renderTranslationObjectType(options, decl, decl.type.value),
        })
      : AST.typealias({
          visibility: options.visibility,
          comment: decl.comment,
          isDeprecated: decl.isDeprecated,
          name: decl.name,
          parameters: decl.parameters.map(param =>
            AST.typeParameter(
              param.name,
              [
                mapNullable(param.constraint, constraint => renderType(options, decl, constraint)),
                options.generateDecodableConformance ? AST.typeIdentifier("Decodable") : undefined,
                AST.typeIdentifier("Equatable"),
                AST.typeIdentifier("Sendable"),
              ].filter(isNotNullish),
            ),
          ),
          type: renderType(options, decl, decl.type.value),
        })

const renderDecl: DeclRenderFn<Decl> = (options, schema, decl) => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return renderEntityDecl(options, schema, decl)
    case NodeKind.SingletonEntityDecl:
      return renderSingletonEntityDecl(options, schema, decl)
    case NodeKind.EnumDecl:
      return renderEnumDecl(options, schema, decl)
    case NodeKind.TypeAliasDecl:
      return renderTypeAliasDecl(options, schema, decl)
    default:
      return assertExhaustive(decl, "Unknown declaration")
  }
}

const renderDeclarations: DeclRenderFn<readonly Decl[], AST.Declaration[]> = (
  options,
  schema,
  declarations,
) => declarations.map(decl => renderDecl(options, schema, decl))

const renderExplicitNestedEntityMapTypes = (options: SwiftRendererOptions): AST.Declaration[] =>
  Object.entries(options.explicitNestedEntityMapTypes).map(([entityName, { comment, typeName }]) =>
    AST.struct({
      comment,
      visibility: options.visibility,
      name: typeName,
      parameters: [
        AST.typeParameter(
          "T",
          [
            options.generateDecodableConformance ? AST.typeIdentifier("Decodable") : undefined,
            AST.typeIdentifier("Equatable"),
            AST.typeIdentifier("Sendable"),
          ].filter(isNotNullish),
        ),
      ],
      constraints: [
        options.generateDecodableConformance ? AST.typeIdentifier("Decodable") : undefined,
        AST.typeIdentifier("Equatable"),
        AST.typeIdentifier("Sendable"),
      ].filter(isNotNullish),
      declarations: [
        AST.member({
          visibility: options.visibility,
          keyword: "let",
          name: "map",
          type: AST.typeLiteral(`[${entityName}.ID: T]`),
        }),
        options.generateDecodableConformance
          ? AST.constructor({
              visibility: options.visibility,
              parameters: [
                { first: "from", second: "decoder", type: AST.typeIdentifier("Decoder") },
              ],
              throws: true,
              body: AST.raw(
                "let container = try decoder.singleValueContainer()",
                `self.map = try container.decode([${entityName}.ID: T].self)`,
              ),
            })
          : undefined,
        AST.constructor({
          visibility: options.visibility,
          parameters: [{ second: "map", type: AST.typeLiteral(`[${entityName}.ID: T]`) }],
          body: AST.raw("self.map = map"),
        }),
      ].filter(isNotNullish),
    }),
  )

const decodableHelpers = (options: SwiftRendererOptions): AST.Declaration[] =>
  options.generateDecodableConformance
    ? [
        AST.extension({
          name: "InlineArray",
          constraints: [AST.typeIdentifier("@retroactive Decodable")],
          where: [{ name: "Element", constraints: [AST.typeIdentifier("Decodable")] }],
          declarations: [
            AST.constructor({
              visibility: "public",
              parameters: [
                { first: "from", second: "decoder", type: AST.typeIdentifier("Decoder") },
              ],
              throws: true,
              body: AST.raw(
                "var container = try decoder.unkeyedContainer()",
                "var elements: [Element] = []",
                "while !container.isAtEnd {",
                AST.raw(
                  "let element = try container.decode(Element.self)",
                  "elements.append(element)",
                ),
                "}",
                "self.init { elements[$0] }",
              ),
            }),
          ],
        }),
        AST.extension({
          name: "InlineArray",
          constraints: [AST.typeIdentifier("@retroactive Equatable")],
          where: [{ name: "Element", constraints: [AST.typeIdentifier("Equatable")] }],
          declarations: [
            AST.func({
              visibility: "public",
              static: true,
              name: "== ",
              parameters: [
                { first: "lhs", type: AST.typeIdentifier("InlineArray<count, Element>") },
                { first: "rhs", type: AST.typeIdentifier("InlineArray<count, Element>") },
              ],
              returnType: AST.typeIdentifier("Bool"),
              body: AST.raw(
                "guard lhs.count == rhs.count else { return false }",
                "for i in 0..<lhs.count {",
                AST.raw("if lhs[i] != rhs[i] {", AST.raw("return false"), "}"),
                "}",
                "return true",
              ),
            }),
          ],
        }),
        AST.enumeration({
          visibility: options.visibility,
          name: "DatabaseInstanceIdDecodingError",
          constraints: [AST.typeIdentifier("Error")],
          declarations: [
            AST.enumCase({ name: "missingIdentifierString" }),
            AST.enumCase({ name: "invalidUUID" }),
          ],
        }),
        AST.extension({
          name: "CodingUserInfoKey",
          declarations: [
            AST.member({
              static: true,
              keyword: "let",
              name: "databaseInstanceIdKey",
              value: AST.raw('CodingUserInfoKey(rawValue: "databaseInstanceIdKey")'),
            }),
          ],
        }),
      ]
    : []

const renderEntityMap = (options: SwiftRendererOptions, schema: Schema): AST.Declaration[] =>
  options.generateEntityMap
    ? [
        AST.member({
          visibility: options.visibility,
          keyword: "let",
          name: "EntityMap",
          type: AST.typeLiteral("[String: Any.Type]"),
          value: AST.raw(
            "[",
            AST.raw(
              [...schema.entities, ...schema.singletonEntities]
                .toSorted(
                  on(
                    e => e.name,
                    (a, b) => a.localeCompare(b),
                  ),
                )
                .map(entity => `"${entity.name}": ${entity.name}.self`)
                .join(",\n"),
            ),
            "]",
          ),
        }),
      ]
    : []

const renderCompressedDatabaseRepresentationType = (
  options: SwiftRendererOptions,
  schema: Schema,
): AST.Declaration[] =>
  options.generateCompressedDatabaseRepresentationType
    ? [
        AST.struct({
          visibility: options.visibility,
          name: "CompressedDatabaseRepresentation",
          constraints: [AST.typeIdentifier("Decodable")],
          declarations: [
            AST.enumeration({
              visibility: "private",
              name: "CodingKeys",
              constraints: [AST.typeIdentifier("String"), AST.typeIdentifier("CodingKey")],
              declarations: [
                ...[...schema.entities, ...schema.singletonEntities]
                  .toSorted(
                    on(
                      e => e.name,
                      (a, b) => a.localeCompare(b),
                    ),
                  )
                  .map(entity =>
                    isSingletonEntityDecl(entity)
                      ? AST.enumCase({
                          name: toCamelCase(entity.name),
                          rawValue: entity.name,
                        })
                      : AST.enumCase({
                          name: toCamelCase(entity.namePlural),
                          rawValue: entity.name,
                        }),
                  ),
              ],
            }),
            ...[...schema.entities, ...schema.singletonEntities]
              .toSorted(
                on(
                  e => e.name,
                  (a, b) => a.localeCompare(b),
                ),
              )
              .map(entity =>
                isSingletonEntityDecl(entity)
                  ? AST.member({
                      keyword: "let",
                      name: toCamelCase(entity.name),
                      type: AST.optional(AST.typeIdentifier(entity.name)),
                    })
                  : AST.member({
                      keyword: "let",
                      name: toCamelCase(entity.namePlural),
                      type: AST.typeLiteral(`[String: ${entity.name}]`),
                    }),
              ),
            AST.func({
              name: "getDictionary",
              typeParameters: [AST.typeParameter("T")],
              parameters: [
                {
                  first: "for",
                  second: "type",
                  type: AST.typeIdentifier("T.Type"),
                },
              ],
              returnType: AST.typeLiteral("[String: T]"),
              body: AST.raw(
                "switch type {",
                ...schema.entities
                  .toSorted(
                    on(
                      e => e.name,
                      (a, b) => a.localeCompare(b),
                    ),
                  )
                  .flatMap(entity => [
                    `case is ${entity.name}.Type:`,
                    AST.raw(`return ${toCamelCase(entity.namePlural)} as? [String: T] ?? [:]`),
                  ]),
                "default:",
                AST.raw("return [:]"),
                "}",
              ),
            }),
            AST.func({
              name: "getSingleton",
              typeParameters: [AST.typeParameter("T")],
              parameters: [
                {
                  first: "for",
                  second: "type",
                  type: AST.typeIdentifier("T.Type"),
                },
              ],
              returnType: AST.optional(AST.typeIdentifier("T")),
              body: AST.raw(
                "switch type {",
                ...schema.singletonEntities
                  .toSorted(
                    on(
                      e => e.name,
                      (a, b) => a.localeCompare(b),
                    ),
                  )
                  .flatMap(entity => [
                    `case is ${entity.name}.Type:`,
                    AST.raw(`return ${toCamelCase(entity.name)} as? T`),
                  ]),
                "default:",
                AST.raw("return nil"),
                "}",
              ),
            }),
          ],
        }),
      ]
    : []

const generateEntityProtocol = (options: SwiftRendererOptions): AST.Declaration[] =>
  options.generateEntityProtocol
    ? [
        AST.protocol({
          name: "Entity",
          constraints: [AST.typeIdentifier("Identifiable")],
          visibility: options.visibility,
          declarations: [],
        }),
        AST.protocol({
          name: "LocaleEntity",
          constraints: [AST.typeIdentifier("Entity")],
          visibility: options.visibility,
          declarations: [AST.associatedtype({ name: "ID", type: AST.typeIdentifier("String") })],
        }),
        AST.protocol({
          name: "GeneralEntity",
          constraints: [AST.typeIdentifier("Entity")],
          visibility: options.visibility,
          declarations: [AST.associatedtype({ name: "ID", type: AST.typeIdentifier("UUID") })],
        }),
      ]
    : []

const generateChildEntityProtocol = (options: SwiftRendererOptions): AST.Declaration[] =>
  options.generateChildEntityProtocol
    ? [
        AST.protocol({
          visibility: options.visibility,
          name: "ChildEntity",
          declarations: [
            AST.associatedtype({
              name: "ParentID",
              constraints: [AST.typeIdentifier("Equatable"), AST.typeIdentifier("Sendable")],
            }),
            AST.pmember({
              name: "parentId",
              type: AST.typeIdentifier("KeyPath<Self, ParentID> & Sendable"),
              static: true,
              keyword: "var",
              accessor: "get",
            }),
          ],
        }),
      ]
    : []

const _renderUniqueHelpers = (options: SwiftRendererOptions, schema: Schema): AST.Declaration[] => [
  AST.importModule("Foundation"),
  ...renderEntityMap(options, schema),
  ...renderCompressedDatabaseRepresentationType(options, schema),
  ...renderExplicitNestedEntityMapTypes(options),
  ...generateEntityProtocol(options),
  ...generateChildEntityProtocol(options),
  ...decodableHelpers(options),
]

export const renderUniqueHelpers = (
  options: Partial<SwiftRendererOptions> = defaultOptions,
  schema: Schema,
): string => {
  const finalOptions = { ...defaultOptions, ...options }
  return AST.renderFile(_renderUniqueHelpers(finalOptions, schema), finalOptions.indentation)
}

export const render = (
  options: Partial<SwiftRendererOptions> = defaultOptions,
  declarations: readonly Decl[],
  schema: Schema,
  singleFile: boolean,
): string => {
  const finalOptions = { ...defaultOptions, ...options }
  return AST.renderFile(
    [
      ...(singleFile
        ? _renderUniqueHelpers(finalOptions, schema)
        : [AST.importModule("Foundation")]),
      ...renderDeclarations(
        finalOptions,
        schema,
        flatMapAuxiliaryDecls((parentNodes, node, existingDecls) => {
          if (isNestedEntityMapType(node)) {
            return existingDecls.some(exDecl => exDecl.name === node.name)
              ? undefined
              : TypeAliasDecl(asDecl(parentNodes[0])?.sourceUrl ?? "", {
                  name: node.name,
                  comment: node.comment,
                  type: () => node.type.value,
                })
          }

          return undefined
        }, declarations),
      ),
    ],
    finalOptions.indentation,
  )
}
