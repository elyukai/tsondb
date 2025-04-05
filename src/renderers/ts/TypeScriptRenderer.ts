import { EOL } from "node:os"
import { Decl } from "../../schema/declarations/Declaration.js"
import { EntityDecl } from "../../schema/declarations/EntityDeclaration.js"
import { EnumDecl } from "../../schema/declarations/EnumDeclaration.js"
import { TypeAliasDecl } from "../../schema/declarations/TypeAliasDecl.js"
import { TypeParameter } from "../../schema/parameters/TypeParameter.js"
import { ArrayType } from "../../schema/types/generic/ArrayType.js"
import { MemberDecl, ObjectType } from "../../schema/types/generic/ObjectType.js"
import { NodeKind } from "../../schema/types/Node.js"
import { BooleanType } from "../../schema/types/primitives/BooleanType.js"
import { NumericType } from "../../schema/types/primitives/NumericType.js"
import { StringType } from "../../schema/types/primitives/StringType.js"
import { GenericArgumentIdentifierType } from "../../schema/types/references/GenericArgumentIdentifierType.js"
import { IncludeIdentifierType } from "../../schema/types/references/IncludeIdentifierType.js"
import { ReferenceIdentifierType } from "../../schema/types/references/ReferenceIdentifierType.js"
import { Type } from "../../schema/types/Type.js"
import { assertExhaustive } from "../../utils/typeSafety.js"
import { applyIndentation, joinSyntax, prefixLines } from "../utils.js"

export type TypeScriptRendererOptions = {
  indentation: number
}

const defaultOptions: TypeScriptRendererOptions = {
  indentation: 2,
}

const renderDocumentation = (comment?: string): string =>
  comment === undefined
    ? ""
    : joinSyntax("/**", EOL, prefixLines(" * ", comment, true), EOL, " */", EOL)

const renderTypeParameters = (
  options: TypeScriptRendererOptions,
  params: TypeParameter[],
): string =>
  params.length === 0
    ? ""
    : `<${params
        .map(param =>
          param.constraint === undefined
            ? param.name
            : joinSyntax(param.name, " extends ", renderType(options, param.constraint)),
        )
        .join(", ")}>`

const renderArrayType = (options: TypeScriptRendererOptions, type: ArrayType<Type>): string =>
  `${renderType(options, type.items)}[]`

const renderObjectType = (
  options: TypeScriptRendererOptions,
  type: ObjectType<Record<string, MemberDecl<Type, boolean>>>,
): string => {
  return joinSyntax(
    "{",
    EOL,
    applyIndentation(
      1,
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
        .join(EOL + EOL),
      options.indentation,
    ),
    EOL,
    "}",
  )
}

const renderBooleanType = (_options: TypeScriptRendererOptions, _type: BooleanType): string =>
  "boolean"

const renderNumericType = (_options: TypeScriptRendererOptions, _type: NumericType): string =>
  "number"

const renderStringType = (_options: TypeScriptRendererOptions, _type: StringType): string =>
  "string"

const renderGenericArgumentIdentifierType = (
  _options: TypeScriptRendererOptions,
  type: GenericArgumentIdentifierType<TypeParameter>,
): string => type.argument.name

const renderReferenceIdentifierType = (
  options: TypeScriptRendererOptions,
  type: ReferenceIdentifierType<
    EntityDecl<
      string,
      ObjectType<Record<string, MemberDecl<Type, boolean>>>,
      string,
      TypeParameter[]
    >
  >,
): string => {
  const referencedType = type.entity.type()
  return joinSyntax(
    "{",
    EOL,
    applyIndentation(
      1,
      joinSyntax(
        'entity: "',
        type.entity.name,
        '"',
        EOL,
        "entityIdentifier: {",
        EOL,
        applyIndentation(
          1,
          type.entity.primaryKey
            .map(key =>
              joinSyntax(key, ": ", renderType(options, referencedType.properties[key]!.type)),
            )
            .join(EOL),
          options.indentation,
        ),
        EOL,
        "}",
      ),
      options.indentation,
    ),
    EOL,
    "}",
  )
}

const renderIncludeIdentifierType = (
  _options: TypeScriptRendererOptions,
  type: IncludeIdentifierType<
    TypeAliasDecl<string, ObjectType<Record<string, MemberDecl<Type, boolean>>>, TypeParameter[]>,
    TypeParameter[]
  >,
): string => type.reference.name

const renderType = (options: TypeScriptRendererOptions, type: Type): string => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return renderArrayType(options, type)
    case NodeKind.ObjectType:
      return renderObjectType(options, type)
    case NodeKind.BooleanType:
      return renderBooleanType(options, type)
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
    default:
      return assertExhaustive(type, "Unknown type")
  }
}

const renderEntityDeclaration = (
  options: TypeScriptRendererOptions,
  decl: EntityDecl<
    string,
    ObjectType<Record<string, MemberDecl<Type, boolean>>>,
    string,
    TypeParameter[]
  >,
): string =>
  joinSyntax(
    renderDocumentation(decl.comment),
    "export interface ",
    decl.name,
    renderTypeParameters(options, decl.parameters),
    " ",
    renderType(options, decl.type()),
  )

const renderEnumDeclaration = (
  options: TypeScriptRendererOptions,
  decl: EnumDecl<string, TypeParameter[]>,
): string =>
  joinSyntax(
    renderDocumentation(decl.comment),
    "export type ",
    decl.name,
    renderTypeParameters(options, decl.parameters),
    " = ",
    "???",
  )

const renderTypeAliasDeclaration = (
  options: TypeScriptRendererOptions,
  decl: TypeAliasDecl<string, Type, TypeParameter[]>,
): string =>
  joinSyntax(
    renderDocumentation(decl.comment),
    "export type ",
    decl.name,
    renderTypeParameters(options, decl.parameters),
    " = ",
    renderType(options, decl.type()),
  )

const renderDeclaration = (options: TypeScriptRendererOptions, decl: Decl): string => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return renderEntityDeclaration(options, decl)
    case NodeKind.EnumDecl:
      return renderEnumDeclaration(options, decl)
    case NodeKind.TypeAliasDecl:
      return renderTypeAliasDeclaration(options, decl)
    default:
      return assertExhaustive(decl, "Unknown declaration")
  }
}

const renderDeclarations = (options: TypeScriptRendererOptions, decls: Decl[]): string =>
  decls.map(decl => renderDeclaration(options, decl)).join(EOL + EOL)

export const render = (
  options: Partial<TypeScriptRendererOptions> = defaultOptions,
  declarations: Decl[],
): string => {
  const finalOptions = { ...defaultOptions, ...options }
  return renderDeclarations(finalOptions, declarations)
}
