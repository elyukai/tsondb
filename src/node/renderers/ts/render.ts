import { EOL } from "node:os"
import { dirname, relative } from "node:path"
import { discriminatorKey } from "../../../shared/enum.ts"
import { unique } from "../../../shared/utils/array.ts"
import { toCamelCase } from "../../../shared/utils/string.ts"
import { assertExhaustive } from "../../../shared/utils/typeSafety.ts"
import { asDecl, type Decl } from "../../schema/declarations/Declaration.ts"
import type { EntityDecl } from "../../schema/declarations/EntityDecl.ts"
import {
  addEphemeralUUIDToType,
  createEntityIdentifierTypeAsDecl,
  isEntityDecl,
} from "../../schema/declarations/EntityDecl.ts"
import type { EnumDecl } from "../../schema/declarations/EnumDecl.ts"
import { TypeAliasDecl } from "../../schema/declarations/TypeAliasDecl.ts"
import { flatMapAuxiliaryDecls, NodeKind } from "../../schema/Node.ts"
import type { TypeParameter } from "../../schema/TypeParameter.ts"
import { ArrayType } from "../../schema/types/generic/ArrayType.ts"
import type { EnumType } from "../../schema/types/generic/EnumType.ts"
import type { MemberDecl, ObjectType } from "../../schema/types/generic/ObjectType.ts"
import { isObjectType } from "../../schema/types/generic/ObjectType.ts"
import type { TranslationObjectType } from "../../schema/types/generic/TranslationObjectType.js"
import { getTypeOfKey } from "../../schema/types/generic/TranslationObjectType.js"
import type { BooleanType } from "../../schema/types/primitives/BooleanType.ts"
import type { DateType } from "../../schema/types/primitives/DateType.ts"
import type { FloatType } from "../../schema/types/primitives/FloatType.ts"
import type { IntegerType } from "../../schema/types/primitives/IntegerType.ts"
import type { StringType } from "../../schema/types/primitives/StringType.js"
import type { ChildEntitiesType } from "../../schema/types/references/ChildEntitiesType.ts"
import type { IncludeIdentifierType } from "../../schema/types/references/IncludeIdentifierType.ts"
import type { NestedEntityMapType } from "../../schema/types/references/NestedEntityMapType.ts"
import { isNestedEntityMapType } from "../../schema/types/references/NestedEntityMapType.ts"
import { ReferenceIdentifierType } from "../../schema/types/references/ReferenceIdentifierType.ts"
import type { TypeArgumentType } from "../../schema/types/references/TypeArgumentType.ts"
import type { Type } from "../../schema/types/Type.ts"
import { ensureSpecialDirStart } from "../../utils/path.ts"
import type { RenderResult } from "../../utils/render.ts"
import {
  combineSyntaxes,
  emptyRenderResult,
  indent,
  prefixLines,
  syntax,
} from "../../utils/render.ts"

export type TypeScriptRendererOptions = {
  indentation: number
  objectTypeKeyword: "interface" | "type"
  preserveFiles: boolean
  generateEntityMapType: boolean
  addIdentifierToEntities: boolean
}

const defaultOptions: TypeScriptRendererOptions = {
  indentation: 2,
  objectTypeKeyword: "interface",
  preserveFiles: false,
  generateEntityMapType: false,
  addIdentifierToEntities: false,
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

const renderObjectType: RenderFn<ObjectType<Record<string, MemberDecl>>> = (options, type) => {
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

const renderFloatType: RenderFn<FloatType> = (_options, _type) => syntax`number`

const renderIntegerType: RenderFn<IntegerType> = (_options, _type) => syntax`number`

const renderStringType: RenderFn<StringType> = (_options, _type) => syntax`string`

const renderTypeArgumentType: RenderFn<TypeArgumentType> = (_options, type) =>
  syntax`${type.argument.name}`

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

const renderChildEntitiesType: RenderFn<ChildEntitiesType> = (options, type) =>
  renderType(options, ArrayType(ReferenceIdentifierType(type.entity), { uniqueItems: true }))

const renderTranslationObjectType: RenderFn<TranslationObjectType> = (options, type) => {
  return wrapAsObject(
    options,
    combineSyntaxes(
      Object.entries(type.properties).map(
        ([name, config]) =>
          syntax`"${name.replace('"', '\\"')}"${
            type.allKeysAreRequired ? "" : "?"
          }: ${renderType(options, getTypeOfKey(config, type))}`,
      ),
      EOL,
    ),
  )
}

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
      return renderFloatType(options, type)
    case NodeKind.IntegerType:
      return renderIntegerType(options, type)
    case NodeKind.StringType:
      return renderStringType(options, type)
    case NodeKind.TypeArgumentType:
      return renderTypeArgumentType(options, type)
    case NodeKind.ReferenceIdentifierType:
      return renderReferenceIdentifierType(options, type)
    case NodeKind.IncludeIdentifierType:
      return renderIncludeIdentifierType(options, type)
    case NodeKind.NestedEntityMapType:
      return renderNestedEntityMapType(options, type)
    case NodeKind.EnumType:
      return renderEnumType(options, type)
    case NodeKind.ChildEntitiesType:
      return renderChildEntitiesType(options, type)
    case NodeKind.TranslationObjectType:
      return renderTranslationObjectType(options, type)
    default:
      return assertExhaustive(type, "Unknown type")
  }
}

const renderEntityDecl: RenderFn<EntityDecl> = (options, decl) =>
  syntax`${renderDocumentation(decl.comment, decl.isDeprecated)}export ${
    options.objectTypeKeyword
  } ${decl.name} ${options.objectTypeKeyword === "type" ? "= " : ""}${renderType(
    options,
    options.addIdentifierToEntities ? addEphemeralUUIDToType(decl) : decl.type.value,
  )}`

const renderEnumDecl: RenderFn<EnumDecl> = (options, decl) =>
  syntax`${renderDocumentation(decl.comment, decl.isDeprecated)}export type ${
    decl.name
  }${renderTypeParameters(options, decl.parameters)} =${renderEnumType(options, decl.type.value)}`

const renderTypeAliasDecl: RenderFn<TypeAliasDecl> = (options, decl) =>
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
        `import { ${unique(names)
          .toSorted((a, b) => a.localeCompare(b))
          .join(", ")} } from "${sourceUrl}"`,
    )
    .join(EOL)

  return importsSyntax.length > 0 ? importsSyntax + EOL + EOL : ""
}

const renderEntityMapType: RenderFn<readonly Decl[]> = (options, declarations) =>
  syntax`export type EntityMap = {${EOL}${indent(
    options.indentation,
    1,
    combineSyntaxes(
      declarations
        .filter(isEntityDecl)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(decl => syntax`${decl.name}: ${decl.name}`),
      EOL,
    ),
  )}${EOL}}${EOL + EOL}`

export const render = (
  options: Partial<TypeScriptRendererOptions> = defaultOptions,
  declarations: readonly Decl[],
): string => {
  const finalOptions = { ...defaultOptions, ...options }
  const [_, entityMap] = finalOptions.generateEntityMapType
    ? renderEntityMapType(finalOptions, declarations)
    : emptyRenderResult
  const [imports, content] = renderDeclarations(
    finalOptions,
    flatMapAuxiliaryDecls((parentNodes, node) => {
      if (isNestedEntityMapType(node)) {
        return TypeAliasDecl(asDecl(parentNodes[0])?.sourceUrl ?? "", {
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
  return (
    entityMap +
    (finalOptions.preserveFiles
      ? (declarations[0] === undefined ? "" : renderImports(declarations[0].sourceUrl, imports)) +
        content
      : content)
  )
}
