import { Lazy } from "../../../shared/utils/lazy.ts"
import { onlyKeys } from "../../../shared/utils/object.ts"
import type {
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  Serializer,
  TypeArgumentsResolver,
  ValidatorOfParamDecl,
} from "../Node.ts"
import { NodeKind } from "../Node.ts"
import type { TypeParameter } from "../TypeParameter.ts"
import { serializeTypeParameter } from "../TypeParameter.ts"
import type { EnumCaseDecl } from "../types/generic/EnumType.ts"
import {
  EnumType,
  getNestedDeclarationsInEnumType,
  getReferencesForEnumType,
  resolveTypeArgumentsInEnumType,
  serializeEnumType,
  validateEnumType,
} from "../types/generic/EnumType.ts"
import type { BaseDecl } from "./Declaration.ts"
import { getTypeArgumentsRecord, validateDeclName } from "./Declaration.ts"

type TConstraint = Record<string, EnumCaseDecl>

export interface EnumDecl<
  Name extends string = string,
  T extends TConstraint = TConstraint,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: NodeKind["EnumDecl"]
  type: Lazy<EnumType<T>>
  isDeprecated?: boolean
}

export const GenEnumDecl = <
  Name extends string,
  T extends TConstraint,
  Params extends TypeParameter[],
>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    parameters: Params
    isDeprecated?: boolean
    values: (...args: Params) => T
  },
): EnumDecl<Name, T, Params> => {
  validateDeclName(options.name)

  const decl: EnumDecl<Name, T, Params> = {
    ...options,
    kind: NodeKind.EnumDecl,
    sourceUrl,
    type: Lazy.of(() => EnumType(options.values(...options.parameters))),
  }

  return decl
}

export { GenEnumDecl as GenEnum }

export const EnumDecl = <Name extends string, T extends Record<string, EnumCaseDecl>>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    isDeprecated?: boolean
    values: () => T
  },
): EnumDecl<Name, T, []> => {
  validateDeclName(options.name)

  const decl: EnumDecl<Name, T, []> = {
    ...onlyKeys(options, "name", "comment", "isDeprecated"),
    kind: NodeKind.EnumDecl,
    sourceUrl,
    parameters: [],
    type: Lazy.of(() => EnumType(options.values())),
  }

  return decl
}

export { EnumDecl as Enum }

export const isEnumDecl: Predicate<EnumDecl> = node => node.kind === NodeKind.EnumDecl

export const getNestedDeclarationsInEnumDecl: GetNestedDeclarations<EnumDecl> = (
  addedDecls,
  decl,
) => getNestedDeclarationsInEnumType(addedDecls, decl.type.value, decl)

export const validateEnumDecl: ValidatorOfParamDecl<EnumDecl> = (helpers, decl, args, value) =>
  validateEnumType(
    helpers,
    resolveTypeArgumentsInEnumType(getTypeArgumentsRecord(decl, args), decl.type.value),
    value,
  )

export const resolveTypeArgumentsInEnumDecl: TypeArgumentsResolver<EnumDecl> = (args, decl) =>
  EnumDecl(decl.sourceUrl, {
    name: decl.name,
    comment: decl.comment,
    isDeprecated: decl.isDeprecated,
    values: () => resolveTypeArgumentsInEnumType(args, decl.type.value).values,
  })

export const serializeEnumDecl: Serializer<EnumDecl> = decl => ({
  ...decl,
  type: serializeEnumType(decl.type.value),
  parameters: decl.parameters.map(param => serializeTypeParameter(param)),
})

export const getReferencesForEnumDecl: GetReferences<EnumDecl> = (decl, value) =>
  getReferencesForEnumType(decl.type.value, value)

export const cases = <T extends TConstraint>(
  decl: EnumDecl<string, T>,
): EnumCaseDecl<T[keyof T]["type"]>[] => Object.values(decl.type.value.values)
