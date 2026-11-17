import { ensureNonEmpty } from "@elyukai/utils/array/nonEmpty"
import { on } from "@elyukai/utils/function"
import { isNotNullish, mapNullable } from "@elyukai/utils/nullable"
import { toCamelCase } from "@elyukai/utils/string"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { EOL } from "node:os"
import { ENUM_DISCRIMINATOR_KEY } from "../../../shared/schema/declarations/EnumDecl.ts"
import { NodeKind } from "../../../shared/schema/Node.ts"
import { indentPlain, prefixLines } from "../../../shared/utils/render.ts"
import { type Decl, asDecl } from "../../schema/dsl/declarations/Decl.ts"
import {
  type EntityDecl,
  addEphemeralUUIDToType,
  isEntityDeclWithParentReference,
} from "../../schema/dsl/declarations/EntityDecl.ts"
import { type EnumDecl, isEnumDecl } from "../../schema/dsl/declarations/EnumDecl.ts"
import {
  type SingletonEntityDecl,
  isSingletonEntityDecl,
} from "../../schema/dsl/declarations/SingletonEntityDecl.ts"
import { TypeAliasDecl } from "../../schema/dsl/declarations/TypeAliasDecl.ts"
import type { EnumCaseDecl, Type } from "../../schema/dsl/index.ts"
import type { TypeParameter } from "../../schema/dsl/TypeParameter.ts"
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

export type SwiftRendererOptions = {
  visibility: "public" | "internal"
  indentation: number
  preserveFiles: boolean
  generateEntityMap: boolean
  generateChildEntityProtocol: boolean
  generateCompressedDatabaseRepresentationType: boolean
  generateIdentifierPropertyForEntities: boolean
  generateDecodableConformance: Boolean
  addIdentifierToEntities: boolean
  explicitNestedEntityMapTypes: {
    [entityName: string]: {
      comment?: string
      typeName: string
    }
  }
}

const defaultOptions: SwiftRendererOptions = {
  visibility: "internal",
  indentation: 2,
  preserveFiles: false,
  generateEntityMap: false,
  generateChildEntityProtocol: false,
  generateCompressedDatabaseRepresentationType: false,
  generateIdentifierPropertyForEntities: true,
  generateDecodableConformance: true,
  addIdentifierToEntities: false,
  explicitNestedEntityMapTypes: {},
}

type RenderFn<T> = (options: SwiftRendererOptions, parentDecl: Decl, node: T) => string

type DeclRenderFn<T> = (options: SwiftRendererOptions, node: T) => string

const reservedKeywords = new Set(["default", "self", "throw"])

const makeSafeIdentifier = (name: string): string =>
  reservedKeywords.has(name) ? `\`${name}\`` : name

const renderDocumentation = (comment?: string, isDeprecated?: boolean): string =>
  [
    comment === undefined ? undefined : prefixLines("/// ", comment, true),
    isDeprecated ? `@available(*, deprecated)` : undefined,
  ]
    .filter(isNotNullish)
    .map(line => `${line}\n`)
    .join("")

const renderTypeConstraints = (
  options: SwiftRendererOptions,
  context: "parameters" | "protocol" | "struct" | "enum",
  ...params: (string | undefined)[]
): string =>
  mapNullable(
    ensureNonEmpty(
      [options.generateDecodableConformance ? "Decodable" : undefined, ...params].filter(
        isNotNullish,
      ),
    ),
    list => `: ${list.join(context === "protocol" || context === "parameters" ? " & " : ", ")}`,
  ) ?? ""

const renderTypeParameters: RenderFn<TypeParameter[]> = (options, decl, params) =>
  params.length === 0
    ? ""
    : `<${params
        .map(param =>
          param.constraint === undefined
            ? `${param.name}${renderTypeConstraints(options, "parameters", "Equatable", "Sendable")}`
            : `${param.name}${renderTypeConstraints(options, "parameters", "Equatable", "Sendable", renderType(options, decl, param.constraint))}`,
        )
        .join(", ")}>`

const renderArrayType: RenderFn<ArrayType> = (options, decl, type) =>
  type.minItems !== undefined && type.minItems === type.maxItems
    ? `[${type.minItems} of ${renderType(options, decl, type.items)}]` // `(${replicate(renderType(options, decl, type.items), type.minItems).join(", ")})`
    : `[${renderType(options, decl, type.items)}]`

const wrapAsObject: RenderFn<string> = (options, _decl, str) =>
  `{
${indentPlain(options.indentation, 1, str)}
}`

const renderObjectType: RenderFn<ObjectType<Record<string, MemberDecl>>> = (options, decl, type) =>
  Object.entries(type.properties)
    .filter(([_key, config]) => !isFinalChildEntitiesType(config.type))
    .map(([name, config]) => {
      const safeName = makeSafeIdentifier(toCamelCase(name))
      return `${renderDocumentation(config.comment, config.isDeprecated)}${renderVisibility(options)}let ${safeName}: ${renderType(options, decl, config.type)}${
        config.isRequired ? "" : "?"
      }`
    })
    .join(Object.values(type.properties).some(prop => prop.comment !== undefined) ? "\n\n" : "\n")

const renderBooleanType: RenderFn<BooleanType> = (_options, _type) => `Bool`

const renderDateType: RenderFn<DateType> = (_options, _type) => "Date"

const renderFloatType: RenderFn<FloatType> = (_options, _type) => `Float`

const renderIntegerType: RenderFn<IntegerType> = (_options, _type) => `Int`

const renderStringType: RenderFn<StringType> = (_options, _type) => `String`

const renderTypeArgumentType: RenderFn<TypeArgumentType> = (_options, _decl, type) =>
  type.argument.name

const renderReferenceIdentifierType: RenderFn<ReferenceIdentifierType> = (_options, _decl, type) =>
  `${type.entity.name}.ID`

const renderIncludeIdentifierType: RenderFn<IncludeIdentifierType> = (options, decl, type) =>
  type.reference.name +
  (type.args.length === 0
    ? ""
    : `<${type.args.map(arg => renderType(options, decl, arg)).join(", ")}>`)

const renderNestedEntityMapType: RenderFn<NestedEntityMapType> = (options, _decl, type) => {
  const explicitType = options.explicitNestedEntityMapTypes[type.secondaryEntity.name]
  return explicitType !== undefined
    ? `${explicitType.typeName}<${type.name}>`
    : `[${type.secondaryEntity.name}.ID: ${type.name}]`
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

const renderEnumType: RenderFn<EnumType> = (options, decl, type) =>
  Object.entries(type.values)
    .map(([caseName, caseDef]) => {
      const safeName = makeSafeIdentifier(toCamelCase(caseName))
      const isIndirect = isIndirectEnumCase(decl, caseDef)
      const base = `${isIndirect ? "indirect " : ""}case ${safeName}`

      return `${renderDocumentation(caseDef.comment, caseDef.isDeprecated)}${
        caseDef.type === null ? base : `${base}(${renderType(options, decl, caseDef.type)})`
      }`
    })
    .join(Object.values(type.values).some(caseDef => caseDef.comment !== undefined) ? "\n\n" : "\n")

const renderChildEntitiesType: RenderFn<ChildEntitiesType> = () => `never`

const renderTranslationObjectType: RenderFn<TranslationObjectType> = (options, _decl, type) =>
  Object.entries(type.properties)
    .map(
      ([name, _config]) =>
        `${renderVisibility(options)}let \`${name.replace('"', '\\"')}\`: String${type.allKeysAreRequired ? "" : "?"}`,
    )
    .join("\n")

const renderType: RenderFn<Type> = (options, decl, type) => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return renderArrayType(options, decl, type)
    case NodeKind.ObjectType:
      return renderObjectType(options, decl, type)
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
    case NodeKind.EnumType:
      return renderEnumType(options, decl, type)
    case NodeKind.ChildEntitiesType:
      return renderChildEntitiesType(options, decl, type)
    case NodeKind.TranslationObjectType:
      return renderTranslationObjectType(options, decl, type)
    default:
      return assertExhaustive(type, "Unknown type")
  }
}

const renderVisibility: (options: SwiftRendererOptions) => string = options =>
  options.visibility === "public" ? "public " : ""

const renderEntityDecl: DeclRenderFn<EntityDecl> = (options, decl) =>
  `${renderDocumentation(decl.comment, decl.isDeprecated)}${renderVisibility(options)}struct ${decl.name}${renderTypeConstraints(options, "struct", "Equatable", "Sendable", options.generateIdentifierPropertyForEntities ? "Identifiable" : undefined, options.generateChildEntityProtocol && isEntityDeclWithParentReference(decl) ? "ChildEntity" : undefined)} {
  ${
    options.generateChildEntityProtocol && isEntityDeclWithParentReference(decl)
      ? (() => {
          const parentType = decl.type.value.properties[decl.parentReferenceKey]
          return `${renderVisibility(options)}typealias ParentID = ${parentType !== undefined ? renderType(options, decl, parentType.type) : "<error>"}
  ${renderVisibility(options)}static let parentId: KeyPath<Self, ParentID> & Sendable = \\.${makeSafeIdentifier(toCamelCase(decl.parentReferenceKey))}

  `
        })()
      : ""
  }${renderVisibility(options)}typealias ID = UUID
${
  options.generateIdentifierPropertyForEntities
    ? `
  ${renderVisibility(options)}let id: ID${Object.values(decl.type.value.properties).some(prop => prop.comment !== undefined) ? "\n" : ""}`
    : ""
}
${indentPlain(
  options.indentation,
  1,
  renderType(
    options,
    decl,
    options.addIdentifierToEntities ? addEphemeralUUIDToType(decl) : decl.type.value,
  ),
)}${
    options.generateDecodableConformance
      ? `

  private enum CodingKeys: String, CodingKey {
${indentPlain(
  options.indentation,
  2,
  Object.entries(decl.type.value.properties)
    .filter(prop => !isChildEntitiesType(prop[1].type))
    .map(([name]) => `case ${makeSafeIdentifier(toCamelCase(name))} = "${name}"`)
    .join("\n"),
)}
  }

  ${renderVisibility(options)}init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)

    let databaseInstanceIdKey = CodingUserInfoKey.databaseInstanceIdKey
    let explicitId = if let databaseInstanceIdKey {
      decoder.userInfo[databaseInstanceIdKey] as? String
    } else {
      String?.none
    }
    let derivedId = decoder.codingPath.last?.stringValue

    guard let id = explicitId ?? derivedId else {
        throw DatabaseInstanceIdDecodingError.missingIdentifierString
    }
    guard let uuid = UUID(uuidString: id) else {
        throw DatabaseInstanceIdDecodingError.invalidUUID
    }

    self.id = uuid
${indentPlain(
  options.indentation,
  2,
  Object.entries(decl.type.value.properties)
    .filter(prop => !isChildEntitiesType(prop[1].type))
    .map(([name, config]) => {
      const safeName = makeSafeIdentifier(toCamelCase(name))
      return `self.${safeName} = try container.${config.isRequired ? "decode" : "decodeIfPresent"}(${renderType(options, decl, config.type)}.self, forKey: .${safeName})`
    })
    .join("\n"),
)}
  }`
      : ""
  }
}`

const renderSingletonEntityDecl: DeclRenderFn<SingletonEntityDecl> = (options, decl) =>
  `${renderDocumentation(decl.comment, decl.isDeprecated)}${renderVisibility(options)}struct ${decl.name}${renderTypeConstraints(options, "struct", "Equatable", "Sendable")} ${wrapAsObject(
    options,
    decl,
    renderType(options, decl, decl.type.value),
  )}`

const renderEnumDecl: DeclRenderFn<EnumDecl> = (options, decl) =>
  `${renderDocumentation(decl.comment, decl.isDeprecated)}${renderVisibility(options)}enum ${
    decl.name
  }${renderTypeParameters(options, decl, decl.parameters)}${renderTypeConstraints(options, "enum", "Equatable", "Sendable")} {
${indentPlain(options.indentation, 1, renderEnumType(options, decl, decl.type.value))}${
    options.generateDecodableConformance
      ? `

  private enum CodingKeys: String, CodingKey {
    case tag = "${ENUM_DISCRIMINATOR_KEY}"
    ${Object.keys(decl.type.value.values)
      .map(name => `case ${makeSafeIdentifier(toCamelCase(name))} = "${name}"`)
      .join("\n    ")}
  }

  private enum Discriminator: String, Decodable {
    ${Object.keys(decl.type.value.values)
      .map(name => `case ${makeSafeIdentifier(toCamelCase(name))} = "${name}"`)
      .join("\n    ")}
  }

  ${renderVisibility(options)}init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    let tag = try container.decode(Discriminator.self, forKey: .tag)
    switch tag {
    ${Object.entries(decl.type.value.values)
      .map(([name, value]) => {
        const safeName = makeSafeIdentifier(toCamelCase(name))
        return `case .${safeName}:
      self = .${safeName}${value.type === null ? "" : `(try container.decode(${renderType(options, decl, value.type)}.self, forKey: .${safeName}))`}`
      })
      .join("\n    ")}
    }
  }`
      : ""
  }
}`

const renderTypeAliasDecl: DeclRenderFn<TypeAliasDecl> = (options, decl) =>
  isObjectType(decl.type.value)
    ? `${renderDocumentation(decl.comment, decl.isDeprecated)}${renderVisibility(options)}struct ${decl.name}${renderTypeParameters(options, decl, decl.parameters)}${renderTypeConstraints(options, "struct", "Equatable", "Sendable")} {
${indentPlain(options.indentation, 1, renderType(options, decl, decl.type.value))}${
        options.generateDecodableConformance
          ? `

  private enum CodingKeys: String, CodingKey {
${indentPlain(
  options.indentation,
  2,
  Object.entries(decl.type.value.properties)
    .filter(prop => !isChildEntitiesType(prop[1].type))
    .map(([name]) => `case ${makeSafeIdentifier(toCamelCase(name))} = "${name}"`)
    .join("\n"),
)}
  }

  ${renderVisibility(options)}init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)

${indentPlain(
  options.indentation,
  2,
  Object.entries(decl.type.value.properties)
    .filter(prop => !isChildEntitiesType(prop[1].type))
    .map(([name, config]) => {
      const safeName = makeSafeIdentifier(toCamelCase(name))
      return `self.${safeName} = try container.${config.isRequired ? "decode" : "decodeIfPresent"}(${renderType(options, decl, config.type)}.self, forKey: .${safeName})`
    })
    .join("\n"),
)}
  }`
          : ""
      }
}`
    : isTranslationObjectType(decl.type.value)
      ? `${renderDocumentation(decl.comment, decl.isDeprecated)}${renderVisibility(options)}struct ${decl.name}${renderTypeParameters(options, decl, decl.parameters)}${renderTypeConstraints(options, "struct", "Equatable", "Sendable")} ${wrapAsObject(options, decl, renderType(options, decl, decl.type.value))}`
      : `${renderDocumentation(decl.comment, decl.isDeprecated)}${renderVisibility(options)}typealias ${
          decl.name
        }${renderTypeParameters(options, decl, decl.parameters)} = ${renderType(options, decl, decl.type.value)}`

const renderDecl: DeclRenderFn<Decl> = (options, decl) => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return renderEntityDecl(options, decl)
    case NodeKind.SingletonEntityDecl:
      return renderSingletonEntityDecl(options, decl)
    case NodeKind.EnumDecl:
      return renderEnumDecl(options, decl)
    case NodeKind.TypeAliasDecl:
      return renderTypeAliasDecl(options, decl)
    default:
      return assertExhaustive(decl, "Unknown declaration")
  }
}

const renderDeclarations: DeclRenderFn<readonly Decl[]> = (options, declarations) =>
  declarations.map(decl => renderDecl(options, decl)).join("\n\n")

const renderExplicitNestedEntityMapTypes = (options: SwiftRendererOptions) =>
  Object.entries(options.explicitNestedEntityMapTypes)
    .map(
      ([entityName, { comment, typeName }]) => `

${renderDocumentation(comment)}${renderVisibility(options)}struct ${typeName}<T${renderTypeConstraints(options, "parameters", "Equatable", "Sendable")}>${renderTypeConstraints(options, "struct", "Equatable", "Sendable")} {
  let dict: [${entityName}.ID: T]${
    options.generateDecodableConformance
      ? `

  ${renderVisibility(options)}init(from decoder: Decoder) throws {
    let container = try decoder.singleValueContainer()
    self.dict = try container.decode([${entityName}.ID: T].self)
  }`
      : ""
  }
}`,
    )
    .join("")

const decodableHelpers = (options: SwiftRendererOptions) =>
  options.generateDecodableConformance
    ? `

extension InlineArray: @retroactive Decodable where Element: Decodable {
  public init(from decoder: Decoder) throws {
    var container = try decoder.unkeyedContainer()
    var elements: [Element] = []
    while !container.isAtEnd {
      let element = try container.decode(Element.self)
      elements.append(element)
    }
    self.init { elements[$0] }
  }
}

extension InlineArray: @retroactive Equatable where Element: Equatable {
  public static func == (lhs: InlineArray<count, Element>, rhs: InlineArray<count, Element>) -> Bool {
    guard lhs.count == rhs.count else { return false }
    for i in 0..<lhs.count {
      if lhs[i] != rhs[i] {
        return false
      }
    }
    return true
  }
}

${renderVisibility(options)}enum DatabaseInstanceIdDecodingError: Error {
  case missingIdentifierString
  case invalidUUID
}

extension CodingUserInfoKey {
  static let databaseInstanceIdKey = CodingUserInfoKey(rawValue: "databaseInstanceIdKey")
}`
    : ""

const renderEntityMap = (
  options: SwiftRendererOptions,
  entities: readonly EntityDecl[],
  singletonEntities: readonly SingletonEntityDecl[],
): string =>
  options.generateEntityMap
    ? `

${renderVisibility(options)}let EntityMap: [String: Any.Type] = [
${indentPlain(
  options.indentation,
  1,
  [...entities, ...singletonEntities]
    .toSorted(
      on(
        e => e.name,
        (a, b) => a.localeCompare(b),
      ),
    )
    .map(entity => `"${entity.name}": ${entity.name}.self`)
    .join(",\n"),
)}
]`
    : ""

const renderCompressedDatabaseRepresentationType = (
  options: SwiftRendererOptions,
  entities: readonly EntityDecl[],
  singletonEntities: readonly SingletonEntityDecl[],
): string =>
  options.generateCompressedDatabaseRepresentationType
    ? `

${renderVisibility(options)}struct CompressedDatabaseRepresentation: Decodable {
${indentPlain(
  options.indentation,
  1,
  `private enum CodingKeys: String, CodingKey {
${indentPlain(
  options.indentation,
  1,
  [...entities, ...singletonEntities]
    .toSorted(
      on(
        e => e.name,
        (a, b) => a.localeCompare(b),
      ),
    )
    .map(entity =>
      isSingletonEntityDecl(entity)
        ? `case ${toCamelCase(entity.name)} = "${entity.name}"`
        : `case ${toCamelCase(entity.namePlural)} = "${entity.name}"`,
    )
    .join("\n"),
)}
}

${[...entities, ...singletonEntities]
  .toSorted(
    on(
      e => e.name,
      (a, b) => a.localeCompare(b),
    ),
  )
  .map(entity =>
    isSingletonEntityDecl(entity)
      ? `let ${toCamelCase(entity.name)}: ${entity.name}?`
      : `let ${toCamelCase(entity.namePlural)}: [String: ${entity.name}]`,
  )
  .join("\n")}`,
)}

  func getDictionary<T>(for type: T.Type) -> [String: T] {
    switch type {
${indentPlain(
  options.indentation,
  2,
  entities
    .toSorted(
      on(
        e => e.name,
        (a, b) => a.localeCompare(b),
      ),
    )
    .map(
      entity => `case is ${entity.name}.Type:
  return ${toCamelCase(entity.namePlural)} as? [String: T] ?? [:]`,
    )
    .join("\n"),
)}
    default:
      return [:]
    }
  }

  func getSingleton<T>(for type: T.Type) -> T? {
    switch type {
${indentPlain(
  options.indentation,
  2,
  singletonEntities
    .toSorted(
      on(
        e => e.name,
        (a, b) => a.localeCompare(b),
      ),
    )
    .map(
      entity => `case is ${entity.name}.Type:
  return ${toCamelCase(entity.name)} as? T`,
    )
    .join("\n"),
)}
    default:
      return nil
    }
  }
}`
    : ""

const generateChildEntityProtocol = (options: SwiftRendererOptions) =>
  options.generateChildEntityProtocol
    ? `

${renderVisibility(options)}protocol ChildEntity {
  associatedtype ParentID: Equatable & Sendable

  static var parentId: KeyPath<Self, ParentID> & Sendable { get }
}`
    : ""

const formatWhitespace = (str: string): string => {
  const withoutTrailingWhitespace = str.replace(/ *\n/gu, EOL)
  return withoutTrailingWhitespace.endsWith(EOL)
    ? withoutTrailingWhitespace
    : `${withoutTrailingWhitespace}${EOL}`
}

export const renderUniqueHelpers = (
  options: Partial<SwiftRendererOptions> = defaultOptions,
  entities: readonly EntityDecl[],
  singletonEntities: readonly SingletonEntityDecl[],
): string => {
  const finalOptions = { ...defaultOptions, ...options }
  const types = [
    renderEntityMap(finalOptions, entities, singletonEntities),
    renderCompressedDatabaseRepresentationType(finalOptions, entities, singletonEntities),
    renderExplicitNestedEntityMapTypes(finalOptions),
    generateChildEntityProtocol(finalOptions),
    decodableHelpers(finalOptions),
  ]
  return formatWhitespace(`import Foundation${types.join("")}`)
}

export const render = (
  options: Partial<SwiftRendererOptions> = defaultOptions,
  declarations: readonly Decl[],
  entities: readonly EntityDecl[],
  singletonEntities: readonly SingletonEntityDecl[],
  singleFile: boolean,
): string => {
  const finalOptions = { ...defaultOptions, ...options }
  return formatWhitespace(`${singleFile ? renderUniqueHelpers(finalOptions, entities, singletonEntities) : `import Foundation\n`}
${renderDeclarations(
  finalOptions,
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
)}`)
}
