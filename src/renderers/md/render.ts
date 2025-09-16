import { EOL } from "node:os"
import { Decl } from "../../schema/declarations/Declaration.js"
import {
  addEphemeralUUIDToType,
  createEntityIdentifierTypeAsDecl,
  EntityDecl,
  isEntityDecl,
} from "../../schema/declarations/EntityDecl.js"
import { EnumDecl } from "../../schema/declarations/EnumDecl.js"
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
import { discriminatorKey } from "../../shared/enum.js"
import { toCamelCase } from "../../shared/utils/string.js"
import { assertExhaustive } from "../../shared/utils/typeSafety.js"
import { applyIndentation, joinSyntax, prefixLines, syntax } from "../../utils/render.js"

export type MarkdownRendererOptions = {
  indentation: number
}

const defaultOptions: MarkdownRendererOptions = {
  indentation: 2,
}

type RenderFn<T> = (options: MarkdownRendererOptions, node: T) => string

const joinLines = (...lines: (string | undefined)[]) =>
  lines.filter(line => line !== undefined).join(EOL)

const joinParagraphs = (...lines: (string | undefined)[]) =>
  lines.filter(line => line !== undefined).join(EOL + EOL)

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const h = (level: number, text: string, anchor?: string) => {
  const safeLevel = clamp(level, 1, 6)
  const anchorElement = anchor === undefined ? "" : ` {#${anchor}}`

  return `${"#".repeat(safeLevel)} ${text}${anchorElement}`
}

const labelledList = (...elements: [label: string, value: string][]) =>
  joinLines(...elements.flatMap(([label, value]) => [label, `: ${value}`]))

const a = (text: string, href: string) => `[${text}](${href})`

const anchorUrl = (anchorName: string, fileUrl = "") => `${fileUrl}#${anchorName}`

const icode = (code: string | number | boolean) => `\`${code}\``

const icodejson = (code: unknown | string | number | boolean) => `\`${JSON.stringify(code)}\``

const boolean = (boolean: boolean) => (boolean ? "Yes" : "No")

const docHeader = (schema: RootNode, jsDoc: Doc | undefined) => {
  const title = jsDoc?.tags.title ?? schema.jsDoc?.tags.title ?? "[TITLE MISSING]"
  const description = jsDoc?.comment ?? schema.jsDoc?.comment

  return headerWithDescription(h(1, title), description)
}

const headerWithDescription = (title: string, description: string | undefined) => {
  if (description === undefined) {
    return title
  }

  return `${title}${EOL}${EOL}${description}`
}

const renderDocumentation = (comment?: string): string =>
  comment === undefined
    ? ""
    : joinSyntax("/**", EOL, prefixLines(" * ", comment, true), EOL, " */", EOL)

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
  return labelledList(
    ...Object.entries(type.properties).map(([name, config]): [string, string] => [
      `${icode(name)}${config.isRequired ? "" : "?"}`,
      renderType(options, config.type),
    ]),
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
  a(`${type.entity.name}_ID`, `#${type.entity.name}_ID`)

const renderIncludeIdentifierType: RenderFn<IncludeIdentifierType> = (_options, type) =>
  a(type.reference.name, `#${type.reference.name}`)

const renderNestedEntityMapType: RenderFn<NestedEntityMapType> = (options, type) =>
  wrapAsObject(options, syntax`[${toCamelCase(type.secondaryEntity.name)}]: ${type.name}`)

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
  joinParagraphs(
    h(3, icode(decl.name), decl.name),
    decl.comment,
    h(4, "Properties"),
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
              caseDef.type === null
                ? ""
                : joinSyntax(EOL, caseName + ": ", renderType(options, caseDef.type)),
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
) =>
  joinParagraphs(
    h(3, icode(decl.name), decl.name),
    decl.comment,
    renderTypeParameters(options, decl.parameters),
    isObjectType(decl.type.value) ? h(3, "Properties") : undefined,
    renderType(options, decl.type.value),
  )

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
  options: Partial<MarkdownRendererOptions> = defaultOptions,
  declarations: readonly Decl[],
): string => {
  const finalOptions = { ...defaultOptions, ...options }
  const finalDeclarations = flatMapAuxiliaryDecls(node => {
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
  }, declarations)

  const entities = finalDeclarations
    .filter(isEntityDecl)
    .sort((a, b) => a.name.localeCompare(b.name))

  const supportingTypes = finalDeclarations
    .filter(decl => !isEntityDecl(decl))
    .sort((a, b) => a.name.localeCompare(b.name))

  return joinParagraphs(
    h(1, "Types"),
    h(2, "Entities"),
    renderDeclarations(finalOptions, entities),
    h(2, "Supporting Types"),
    renderDeclarations(finalOptions, supportingTypes),
  )
}
