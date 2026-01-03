import { Lazy } from "../../../shared/utils/lazy.ts"
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
  ValidationContext,
  ValidatorOfParamDecl,
} from "../Node.ts"
import {
  getNestedDeclarations,
  getReferences,
  NodeKind,
  resolveTypeArguments,
  serializeNode,
  validateType,
} from "../Node.ts"
import type { TypeParameter } from "../TypeParameter.ts"
import { serializeTypeParameter } from "../TypeParameter.ts"
import { checkCustomConstraintsInType, type Type } from "../types/Type.ts"
import type { BaseDecl, Decl, TypeArguments } from "./Declaration.ts"
import { getTypeArgumentsRecord, validateDeclName } from "./Declaration.ts"

export interface TypeAliasDecl<
  Name extends string = string,
  T extends Type = Type,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: NodeKind["TypeAliasDecl"]
  type: Lazy<T>
  isDeprecated?: boolean
  customConstraints?: NestedCustomConstraint
}

export const GenTypeAliasDecl = <
  Name extends string,
  T extends Type,
  Params extends TypeParameter[],
>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    isDeprecated?: boolean
    parameters: Params
    type: (...args: Params) => T
    customConstraints?: TypedNestedCustomConstraint<Name>
  },
): TypeAliasDecl<Name, T, Params> => {
  validateDeclName(options.name)

  const decl: TypeAliasDecl<Name, T, Params> = {
    ...options,
    kind: NodeKind.TypeAliasDecl,
    sourceUrl,
    type: Lazy.of(() => options.type(...options.parameters)),
    customConstraints: options.customConstraints as NestedCustomConstraint | undefined, // ignore contravariance of registered enum type
  }

  return decl
}

export { GenTypeAliasDecl as GenTypeAlias }

export const TypeAliasDecl = <Name extends string, T extends Type>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    isDeprecated?: boolean
    type: () => T
    customConstraints?: TypedNestedCustomConstraint<Name>
  },
): TypeAliasDecl<Name, T, []> => {
  validateDeclName(options.name)

  const decl: TypeAliasDecl<Name, T, []> = {
    ...options,
    kind: NodeKind.TypeAliasDecl,
    sourceUrl,
    parameters: [],
    type: Lazy.of(() => options.type()),
    customConstraints: options.customConstraints as NestedCustomConstraint | undefined, // ignore contravariance of registered type alias type
  }

  return decl
}

export { TypeAliasDecl as TypeAlias }

export const isTypeAliasDecl: Predicate<TypeAliasDecl> = node =>
  node.kind === NodeKind.TypeAliasDecl

export const getNestedDeclarationsInTypeAliasDecl: GetNestedDeclarations<TypeAliasDecl> = (
  addedDecls,
  decl,
) => getNestedDeclarations(addedDecls, decl.type.value, decl)

export const validateTypeAliasDecl = (<Params extends TypeParameter[]>(
  helpers: ValidationContext,
  inDecls: Decl[],
  decl: TypeAliasDecl<string, Type, Params>,
  args: TypeArguments<Params>,
  value: unknown,
) =>
  validateType(
    helpers,
    [...inDecls, decl],
    resolveTypeArguments(getTypeArgumentsRecord(decl, args), decl.type.value, [...inDecls, decl]),
    value,
  )) satisfies ValidatorOfParamDecl<TypeAliasDecl>

export const resolveTypeArgumentsInTypeAliasDecl: TypeArgumentsResolver<TypeAliasDecl> = (
  args,
  decl,
  inDecl,
) =>
  TypeAliasDecl(decl.sourceUrl, {
    ...decl,
    type: () => resolveTypeArguments(args, decl.type.value, [...inDecl, decl]),
    customConstraints: decl.customConstraints as TypedNestedCustomConstraint<string> | undefined, // ignore contravariance of registered type alias type
  })

export const serializeTypeAliasDecl: Serializer<TypeAliasDecl> = type => ({
  ...type,
  type: serializeNode(type.type.value),
  parameters: type.parameters.map(param => serializeTypeParameter(param)),
  customConstraints: type.customConstraints !== undefined,
})

export const getReferencesForTypeAliasDecl: GetReferences<TypeAliasDecl> = (decl, value, inDecl) =>
  getReferences(decl.type.value, value, [...inDecl, decl])

export const checkCustomConstraintsInTypeAliasDecl: CustomConstraintValidator<TypeAliasDecl> = (
  decl,
  value,
  helpers,
) =>
  (decl.customConstraints?.({ ...helpers, value }) ?? []).concat(
    checkCustomConstraintsInType(decl.type.value, value, helpers),
  )
