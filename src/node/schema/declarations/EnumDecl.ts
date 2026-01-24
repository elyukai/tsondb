import { Lazy } from "@elyukai/utils/lazy"
import { onlyKeys } from "@elyukai/utils/object"
import {
  ENUM_DISCRIMINATOR_KEY,
  type EnumValue,
} from "../../../shared/schema/declarations/EnumDecl.ts"
import type {
  NestedCustomConstraint,
  TypedNestedCustomConstraint,
} from "../../utils/customConstraints.ts"
import type {
  CustomConstraintValidator,
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
import { checkCustomConstraintsInType } from "../types/Type.ts"
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
  customConstraints?: NestedCustomConstraint
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
    customConstraints?: TypedNestedCustomConstraint<Name>
  },
): EnumDecl<Name, T, Params> => {
  validateDeclName(options.name)

  const decl: EnumDecl<Name, T, Params> = {
    ...options,
    kind: NodeKind.EnumDecl,
    sourceUrl,
    type: Lazy.of(() => EnumType(options.values(...options.parameters))),
    customConstraints: options.customConstraints as NestedCustomConstraint | undefined, // ignore contravariance of registered enum type
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
    customConstraints?: TypedNestedCustomConstraint<Name>
  },
): EnumDecl<Name, T, []> => {
  validateDeclName(options.name)

  const decl: EnumDecl<Name, T, []> = {
    ...onlyKeys(options, "name", "comment", "isDeprecated"),
    kind: NodeKind.EnumDecl,
    sourceUrl,
    parameters: [],
    type: Lazy.of(() => EnumType(options.values())),
    customConstraints: options.customConstraints as NestedCustomConstraint | undefined, // ignore contravariance of registered enum type
  }

  return decl
}

export { EnumDecl as Enum }

export const isEnumDecl: Predicate<EnumDecl> = node => node.kind === NodeKind.EnumDecl

export const getNestedDeclarationsInEnumDecl: GetNestedDeclarations<EnumDecl> = (
  addedDecls,
  decl,
) => getNestedDeclarationsInEnumType(addedDecls, decl.type.value, decl)

export const validateEnumDecl: ValidatorOfParamDecl<EnumDecl> = (
  helpers,
  inDecls,
  decl,
  args,
  value,
) =>
  validateEnumType(
    helpers,
    [...inDecls, decl],
    resolveTypeArgumentsInEnumType(getTypeArgumentsRecord(decl, args), decl.type.value, [
      ...inDecls,
      decl,
    ]),
    value,
  )

export const resolveTypeArgumentsInEnumDecl: TypeArgumentsResolver<EnumDecl> = (
  args,
  decl,
  inDecl,
) =>
  EnumDecl(decl.sourceUrl, {
    name: decl.name,
    comment: decl.comment,
    isDeprecated: decl.isDeprecated,
    values: () => resolveTypeArgumentsInEnumType(args, decl.type.value, [...inDecl, decl]).values,
  })

export const serializeEnumDecl: Serializer<EnumDecl> = decl => ({
  ...decl,
  type: serializeEnumType(decl.type.value),
  parameters: decl.parameters.map(param => serializeTypeParameter(param)),
  customConstraints: decl.customConstraints !== undefined,
})

export const getReferencesForEnumDecl: GetReferences<EnumDecl> = (decl, value, inDecl) =>
  getReferencesForEnumType(decl.type.value, value, [...inDecl, decl])

export const cases = <T extends TConstraint>(
  decl: EnumDecl<string, T>,
): EnumCaseDecl<T[keyof T]["type"]>[] => Object.values(decl.type.value.values)

export const getAnyEnumCaseValue = <K extends string, V>(
  enumValue: { [Key in K]: EnumValue<Key, V> }[K],
): V => enumValue[enumValue[ENUM_DISCRIMINATOR_KEY]]

export const checkCustomConstraintsInEnumDecl: CustomConstraintValidator<EnumDecl> = (
  decl,
  value,
  helpers,
) =>
  (decl.customConstraints?.({ ...helpers, value }) ?? []).concat(
    checkCustomConstraintsInType(decl.type.value, value, helpers),
  )
