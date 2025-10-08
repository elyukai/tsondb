import { Lazy } from "../../../shared/utils/lazy.ts"
import type {
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  Serializer,
  TypeArgumentsResolver,
  ValidatorOfParamDecl,
  Validators,
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
import type { Type } from "../types/Type.ts"
import type { BaseDecl, TypeArguments } from "./Declaration.ts"
import { getTypeArgumentsRecord, validateDeclName } from "./Declaration.ts"

export interface TypeAliasDecl<
  Name extends string = string,
  T extends Type = Type,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: NodeKind["TypeAliasDecl"]
  type: Lazy<T>
  isDeprecated?: boolean
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
  },
): TypeAliasDecl<Name, T, Params> => {
  validateDeclName(options.name)

  const decl: TypeAliasDecl<Name, T, Params> = {
    ...options,
    kind: NodeKind.TypeAliasDecl,
    sourceUrl,
    type: Lazy.of(() => options.type(...options.parameters)),
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
  },
): TypeAliasDecl<Name, T, []> => {
  validateDeclName(options.name)

  const decl: TypeAliasDecl<Name, T, []> = {
    ...options,
    kind: NodeKind.TypeAliasDecl,
    sourceUrl,
    parameters: [],
    type: Lazy.of(() => options.type()),
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
  helpers: Validators,
  decl: TypeAliasDecl<string, Type, Params>,
  args: TypeArguments<Params>,
  value: unknown,
) =>
  validateType(
    helpers,
    resolveTypeArguments(getTypeArgumentsRecord(decl, args), decl.type.value),
    value,
  )) satisfies ValidatorOfParamDecl<TypeAliasDecl>

export const resolveTypeArgumentsInTypeAliasDecl: TypeArgumentsResolver<TypeAliasDecl> = (
  args,
  decl,
) =>
  TypeAliasDecl(decl.sourceUrl, {
    ...decl,
    type: () => resolveTypeArguments(args, decl.type.value),
  })

export const serializeTypeAliasDecl: Serializer<TypeAliasDecl> = type => ({
  ...type,
  type: serializeNode(type.type.value),
  parameters: type.parameters.map(param => serializeTypeParameter(param)),
})

export const getReferencesForTypeAliasDecl: GetReferences<TypeAliasDecl> = (decl, value) =>
  getReferences(decl.type.value, value)
