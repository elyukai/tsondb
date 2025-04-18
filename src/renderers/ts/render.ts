import { EOL } from "node:os"
import { Decl } from "../../schema/declarations/Declaration.js"
import {
  addEphemeralUUIDToType,
  createEntityIdentifierTypeAsDecl,
  EntityDecl,
  isEntityDecl,
} from "../../schema/declarations/EntityDecl.js"
import { discriminatorKey, EnumDecl } from "../../schema/declarations/EnumDecl.js"
import { TypeAliasDecl } from "../../schema/declarations/TypeAliasDecl.js"
import { flatMapAuxiliaryDecls, NodeKind } from "../../schema/Node.js"
import { TypeParameter } from "../../schema/parameters/TypeParameter.js"
import { ArrayType } from "../../schema/types/generic/ArrayType.js"
import { isObjectType, MemberDecl, ObjectType } from "../../schema/types/generic/ObjectType.js"
import { BooleanType } from "../../schema/types/primitives/BooleanType.js"
import { DateType } from "../../schema/types/primitives/DateType.js"
import { NumericType } from "../../schema/types/primitives/NumericType.js"
import { StringType } from "../../schema/types/primitives/StringType.js"
import { GenericArgumentIdentifierType } from "../../schema/types/references/GenericArgumentIdentifierType.js"
import { IncludeIdentifierType } from "../../schema/types/references/IncludeIdentifierType.js"
import {
  isNestedEntityMapType,
  NestedEntityMapType,
} from "../../schema/types/references/NestedEntityMapType.js"
import { ReferenceIdentifierType } from "../../schema/types/references/ReferenceIdentifierType.js"
import { getParentDecl, Type } from "../../schema/types/Type.js"
import { applyIndentation, joinSyntax, prefixLines, syntax } from "../../utils/render.js"
import { toCamelCase } from "../../utils/string.js"
import { assertExhaustive } from "../../utils/typeSafety.js"

export type TypeScriptRendererOptions = {
  indentation: number
}

const defaultOptions: TypeScriptRendererOptions = {
  indentation: 2,
}

type RenderFn<T> = (options: TypeScriptRendererOptions, node: T) => string

const renderDocumentation = (comment?: string): string =>
  comment === undefined
    ? ""
    : syntax`/**
${prefixLines(" * ", comment, true)}
 */
`

const renderTypeParameters: RenderFn<TypeParameter[]> = (options, params) =>
  params.length === 0
    ? ""
    : `<${params
        .map(param =>
          param.constraint === undefined
            ? param.name
            : joinSyntax(param.name, " extends ", renderType(options, param.constraint)),
        )
        .join(", ")}>`

const renderArrayType: RenderFn<ArrayType> = (options, type) =>
  `${renderType(options, type.items)}[]`

const wrapAsObject: RenderFn<string> = (options, syntax) =>
  joinSyntax("{", EOL, applyIndentation(1, syntax, options.indentation), EOL, "}")

const renderObjectType: RenderFn<ObjectType<Record<string, MemberDecl<Type, boolean>>>> = (
  options,
  type,
) => {
  return wrapAsObject(
    options,
    Object.entries(type.properties)
      .map(([name, config]) =>
        joinSyntax(
          renderDocumentation(config.comment),
          name,
          config.isRequired ? "" : "?",
          ": ",
          renderType(options, config.type),
        ),
      )
      .join(
        Object.values(type.properties).some(prop => prop.comment !== undefined) ? EOL + EOL : EOL,
      ),
  )
}

const renderBooleanType: RenderFn<BooleanType> = (_options, _type) => "boolean"

const renderDateType: RenderFn<DateType> = (_options, _type) => "Date"

const renderNumericType: RenderFn<NumericType> = (_options, _type) => "number"

const renderStringType: RenderFn<StringType> = (_options, _type) => "string"

const renderGenericArgumentIdentifierType: RenderFn<
  GenericArgumentIdentifierType<TypeParameter>
> = (_options, type) => type.argument.name

const renderReferenceIdentifierType: RenderFn<ReferenceIdentifierType> = (_options, type) =>
  type.entity.name + "_ID"

const renderIncludeIdentifierType: RenderFn<IncludeIdentifierType> = (_options, type) =>
  type.reference.name

const renderNestedEntityMapType: RenderFn<NestedEntityMapType> = (options, type) =>
  wrapAsObject(options, syntax`[${toCamelCase(type.secondaryEntity.name)}Id: string]: ${type.name}`)

const renderType: RenderFn<Type> = (options, type) => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return renderArrayType(options, type)
    case NodeKind.ObjectType:
      return renderObjectType(options, type)
    case NodeKind.BooleanType:
      return renderBooleanType(options, type)
    case NodeKind.DateType:
      return renderDateType(options, type)
    case NodeKind.FloatType:
      return renderNumericType(options, type)
    case NodeKind.IntegerType:
      return renderNumericType(options, type)
    case NodeKind.StringType:
      return renderStringType(options, type)
    case NodeKind.GenericArgumentIdentifierType:
      return renderGenericArgumentIdentifierType(options, type)
    case NodeKind.ReferenceIdentifierType:
      return renderReferenceIdentifierType(options, type)
    case NodeKind.IncludeIdentifierType:
      return renderIncludeIdentifierType(options, type)
    case NodeKind.NestedEntityMapType:
      return renderNestedEntityMapType(options, type)
    default:
      return assertExhaustive(type, "Unknown type")
  }
}

const renderEntityDecl: RenderFn<EntityDecl> = (options, decl) =>
  joinSyntax(
    renderDocumentation(decl.comment),
    "export interface ",
    decl.name,
    " ",
    renderType(options, addEphemeralUUIDToType(decl)),
  )

const renderEnumDecl: RenderFn<EnumDecl> = (options, decl) =>
  joinSyntax(
    renderDocumentation(decl.comment),
    "export type ",
    decl.name,
    renderTypeParameters(options, decl.parameters),
    " =",
    ...Object.entries(decl.values.value).map(([caseName, caseDef]) =>
      applyIndentation(
        1,
        joinSyntax(
          EOL,
          "| {",
          EOL,
          applyIndentation(
            1,
            joinSyntax(
              `${discriminatorKey}: "${caseName}"`,
              caseDef === null
                ? ""
                : joinSyntax(EOL, caseName + ": ", renderType(options, caseDef)),
            ),
            options.indentation,
          ),
          EOL,
          "}",
        ),
        options.indentation,
      ),
    ),
  )

const renderTypeAliasDecl: RenderFn<TypeAliasDecl<string, Type, TypeParameter[]>> = (
  options,
  decl,
) => {
  const type = decl.type.value
  return isObjectType(type)
    ? joinSyntax(
        renderDocumentation(decl.comment),
        "export interface ",
        decl.name,
        renderTypeParameters(options, decl.parameters),
        " ",
        renderType(options, type),
      )
    : joinSyntax(
        renderDocumentation(decl.comment),
        "export type ",
        decl.name,
        renderTypeParameters(options, decl.parameters),
        " = ",
        renderType(options, type),
      )
}

const renderDecl: RenderFn<Decl> = (options, decl) => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return renderEntityDecl(options, decl)
    case NodeKind.EnumDecl:
      return renderEnumDecl(options, decl)
    case NodeKind.TypeAliasDecl:
      return renderTypeAliasDecl(options, decl)
    default:
      return assertExhaustive(decl, "Unknown declaration")
  }
}

const renderDeclarations: RenderFn<Decl[]> = (options, declarations) =>
  declarations.map(decl => renderDecl(options, decl)).join(EOL + EOL)

export const render = (
  options: Partial<TypeScriptRendererOptions> = defaultOptions,
  declarations: readonly Decl[],
): string => {
  const finalOptions = { ...defaultOptions, ...options }
  return renderDeclarations(
    finalOptions,
    flatMapAuxiliaryDecls(node => {
      if (isNestedEntityMapType(node)) {
        return TypeAliasDecl(getParentDecl(node)?.sourceUrl ?? "", {
          name: node.name,
          comment: node.comment,
          type: () => node.type.value,
        })
      } else if (isEntityDecl(node)) {
        return createEntityIdentifierTypeAsDecl(node)
      }

      return undefined
    }, declarations),
  )
}
