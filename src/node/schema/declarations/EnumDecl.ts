import { Lazy } from "../../../shared/utils/lazy.js"
import { GetReferences, Node, NodeKind, Serializer } from "../Node.js"
import { SerializedTypeParameter, serializeTypeParameter, TypeParameter } from "../TypeParameter.js"
import {
  EnumCaseDecl,
  EnumType,
  getNestedDeclarationsInEnumType,
  getReferencesForEnumType,
  resolveTypeArgumentsInEnumType,
  SerializedEnumCaseDecl,
  SerializedEnumType,
  serializeEnumType,
  validateEnumType,
} from "../types/generic/EnumType.js"
import { Type } from "../types/Type.js"
import { ValidatorHelpers } from "../validation/type.js"
import {
  BaseDecl,
  GetNestedDeclarations,
  getTypeArgumentsRecord,
  SerializedBaseDecl,
  TypeArguments,
  validateDeclName,
} from "./Declaration.js"

export interface EnumDecl<
  Name extends string = string,
  T extends Record<string, EnumCaseDecl> = Record<string, EnumCaseDecl>,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: NodeKind["EnumDecl"]
  type: Lazy<EnumType<T>>
  isDeprecated?: boolean
}

export interface SerializedEnumDecl<
  Name extends string = string,
  T extends Record<string, SerializedEnumCaseDecl> = Record<string, SerializedEnumCaseDecl>,
  Params extends SerializedTypeParameter[] = SerializedTypeParameter[],
> extends SerializedBaseDecl<Name, Params> {
  kind: NodeKind["EnumDecl"]
  type: SerializedEnumType<T>
  isDeprecated?: boolean
}

export const GenEnumDecl = <
  Name extends string,
  T extends Record<string, EnumCaseDecl>,
  Params extends TypeParameter[],
>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    parameters: Params
    values: (...args: Params) => T
  },
): EnumDecl<Name, T, Params> => {
  validateDeclName(options.name)

  const decl: EnumDecl<Name, T, Params> = {
    ...options,
    kind: NodeKind.EnumDecl,
    sourceUrl,
    type: Lazy.of(() => {
      const type = EnumType(options.values(...options.parameters))
      type.parent = decl
      return type
    }),
  }

  return decl
}

export { GenEnumDecl as GenEnum }

export const EnumDecl = <Name extends string, T extends Record<string, EnumCaseDecl>>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    values: () => T
  },
): EnumDecl<Name, T, []> => {
  validateDeclName(options.name)

  const decl: EnumDecl<Name, T, []> = {
    ...options,
    kind: NodeKind.EnumDecl,
    sourceUrl,
    parameters: [],
    type: Lazy.of(() => {
      const type = EnumType(options.values())
      type.parent = decl
      return type
    }),
  }

  return decl
}

export { EnumDecl as Enum }

export const isEnumDecl = (node: Node): node is EnumDecl => node.kind === NodeKind.EnumDecl

export const getNestedDeclarationsInEnumDecl: GetNestedDeclarations<EnumDecl> = (
  addedDecls,
  decl,
) => getNestedDeclarationsInEnumType(addedDecls, decl.type.value)

export const validateEnumDecl = (
  helpers: ValidatorHelpers,
  decl: EnumDecl,
  args: Type[],
  value: unknown,
): Error[] =>
  validateEnumType(
    helpers,
    resolveTypeArgumentsInEnumType(getTypeArgumentsRecord(decl, args), decl.type.value),
    value,
  )

export const resolveTypeArgumentsInEnumDecl = <Params extends TypeParameter[]>(
  decl: EnumDecl<string, Record<string, EnumCaseDecl>, Params>,
  args: TypeArguments<Params>,
): EnumDecl<string, Record<string, EnumCaseDecl>, []> => {
  const resolvedArgs = getTypeArgumentsRecord(decl, args)
  return EnumDecl(decl.sourceUrl, {
    ...decl,
    values: () => resolveTypeArgumentsInEnumType(resolvedArgs, decl.type.value).values,
  })
}

export const serializeEnumDecl: Serializer<EnumDecl, SerializedEnumDecl> = decl => ({
  ...decl,
  type: serializeEnumType(decl.type.value),
  parameters: decl.parameters.map(param => serializeTypeParameter(param)),
})

export const getReferencesForEnumDecl: GetReferences<EnumDecl> = (decl, value) =>
  getReferencesForEnumType(decl.type.value, value)
