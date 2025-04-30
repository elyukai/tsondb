import { EOL } from "node:os"
import { dirname, relative } from "node:path"
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
import { EnumType } from "../../schema/types/generic/EnumType.js"
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
import { ensureSpecialDirStart } from "../../utils/path.js"
import { combineSyntaxes, indent, prefixLines, RenderResult, syntax } from "../../utils/render.js"

export type TypeScriptRendererOptions = {
  indentation: number
  objectTypeKeyword: "interface" | "type"
  preserveFiles: boolean
}

const defaultOptions: TypeScriptRendererOptions = {
  indentation: 2,
  objectTypeKeyword: "interface",
  preserveFiles: false,
}

type RenderFn<T> = (options: TypeScriptRendererOptions, node: T) => RenderResult

const renderDocumentation = (comment?: string, isDeprecated?: boolean): RenderResult =>
  syntax`${
    comment === undefined
      ? ""
      : syntax`/**
${prefixLines(" * ", comment, true)}${
          isDeprecated
            ? syntax`
 * @deprecated`
            : ""
        }
 */
`
  }`

const renderTypeParameters: RenderFn<TypeParameter[]> = (options, params) =>
  syntax`${
    params.length === 0
      ? ""
      : syntax`<${combineSyntaxes(
          params.map(param =>
            param.constraint === undefined
              ? param.name
              : syntax`${param.name} extends ${renderType(options, param.constraint)}`,
          ),
          ", ",
        )}>`
  }`

const renderArrayType: RenderFn<ArrayType> = (options, type) =>
  syntax`${renderType(options, type.items)}[]`

const wrapAsObject: RenderFn<RenderResult> = (options, str) =>
  syntax`{${EOL}${indent(options.indentation, 1, str)}${EOL}}`

const renderObjectType: RenderFn<ObjectType<Record<string, MemberDecl<Type, boolean>>>> = (
  options,
  type,
) => {
  return wrapAsObject(
    options,
    combineSyntaxes(
      Object.entries(type.properties).map(
        ([name, config]) =>
          syntax`${renderDocumentation(config.comment, config.isDeprecated)}${name}${
            config.isRequired ? "" : "?"
          }: ${renderType(options, config.type)}`,
      ),
      Object.values(type.properties).some(prop => prop.comment !== undefined) ? EOL + EOL : EOL,
    ),
  )
}

const renderBooleanType: RenderFn<BooleanType> = (_options, _type) => syntax`boolean`

const renderDateType: RenderFn<DateType> = (_options, _type) => syntax`Date`

const renderNumericType: RenderFn<NumericType> = (_options, _type) => syntax`number`

const renderStringType: RenderFn<StringType> = (_options, _type) => syntax`string`

const renderGenericArgumentIdentifierType: RenderFn<
  GenericArgumentIdentifierType<TypeParameter>
> = (_options, type) => syntax`${type.argument.name}`

const renderReferenceIdentifierType: RenderFn<ReferenceIdentifierType> = (_options, type) => [
  { [type.entity.sourceUrl]: [type.entity.name + "_ID"] },
  type.entity.name + "_ID",
]

const renderIncludeIdentifierType: RenderFn<IncludeIdentifierType> = (options, type) =>
  combineSyntaxes([
    [{ [type.reference.sourceUrl]: [type.reference.name] }, type.reference.name],
    type.args.length === 0
      ? ""
      : syntax`<${combineSyntaxes(
          type.args.map(arg => renderType(options, arg)),
          ", ",
        )}>`,
  ])

const renderNestedEntityMapType: RenderFn<NestedEntityMapType> = (options, type) =>
  wrapAsObject(options, syntax`[${toCamelCase(type.secondaryEntity.name)}Id: string]: ${type.name}`)

const renderEnumType: RenderFn<EnumType> = (options, type) =>
  combineSyntaxes(
    Object.entries(type.values).map(([caseName, caseDef]) =>
      indent(
        options.indentation,
        1,
        syntax`${EOL}| {${EOL}${indent(
          options.indentation,
          1,
          syntax`${discriminatorKey}: "${caseName}"${
            caseDef.type === null
              ? ""
              : syntax`${EOL}${caseName}: ${renderType(options, caseDef.type)}`
          }`,
        )}${EOL}}`,
      ),
    ),
  )

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
    case NodeKind.EnumType:
      return renderEnumType(options, type)
    default:
      return assertExhaustive(type, "Unknown type")
  }
}

const renderEntityDecl: RenderFn<EntityDecl> = (options, decl) =>
  syntax`${renderDocumentation(decl.comment, decl.isDeprecated)}export ${
    options.objectTypeKeyword
  } ${decl.name} ${options.objectTypeKeyword === "type" ? "= " : ""}${renderType(
    options,
    addEphemeralUUIDToType(decl),
  )}`

const renderEnumDecl: RenderFn<EnumDecl> = (options, decl) =>
  syntax`${renderDocumentation(decl.comment, decl.isDeprecated)}export type ${
    decl.name
  }${renderTypeParameters(options, decl.parameters)} =${renderEnumType(options, decl.type.value)}`

const renderTypeAliasDecl: RenderFn<TypeAliasDecl<string, Type, TypeParameter[]>> = (
  options,
  decl,
) =>
  isObjectType(decl.type.value)
    ? syntax`${renderDocumentation(decl.comment, decl.isDeprecated)}export ${
        options.objectTypeKeyword
      } ${decl.name}${renderTypeParameters(options, decl.parameters)} ${
        options.objectTypeKeyword === "type" ? "= " : ""
      }${renderType(options, decl.type.value)}`
    : syntax`${renderDocumentation(decl.comment, decl.isDeprecated)}export type ${
        decl.name
      }${renderTypeParameters(options, decl.parameters)} = ${renderType(options, decl.type.value)}`

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
  combineSyntaxes(
    declarations.map(decl => renderDecl(options, decl)),
    EOL + EOL,
  )

const renderImports = (currentUrl: string, imports: { [sourceUrl: string]: string[] }): string => {
  const importsSyntax = Object.entries(imports)
    .filter(([sourceUrl]) => sourceUrl !== currentUrl)
    .map(([sourceUrl, names]): [string, string[]] => [
      ensureSpecialDirStart(relative(dirname(currentUrl), sourceUrl)),
      names,
    ])
    .toSorted(([sourceUrlA], [sourceUrlB]) => sourceUrlA.localeCompare(sourceUrlB))
    .map(
      ([sourceUrl, names]) =>
        `import { ${names.toSorted((a, b) => a.localeCompare(b)).join(", ")} } from "${sourceUrl}"`,
    )
    .join(EOL)

  return importsSyntax.length > 0 ? importsSyntax + EOL + EOL : ""
}

export const render = (
  options: Partial<TypeScriptRendererOptions> = defaultOptions,
  declarations: readonly Decl[],
): string => {
  const finalOptions = { ...defaultOptions, ...options }
  const [imports, content] = renderDeclarations(
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
  return finalOptions.preserveFiles
    ? renderImports(declarations[0]!.sourceUrl, imports) + content
    : content
}
