import { Lazy } from "../../../shared/utils/lazy.ts"
import type { GetReferences, Node, Serializer } from "../Node.ts"
import { NodeKind } from "../Node.ts"
import type { SerializedTypeParameter, TypeParameter } from "../TypeParameter.ts"
import { serializeTypeParameter } from "../TypeParameter.ts"
import type { SerializedType, Type } from "../types/Type.ts"
import {
  getReferencesForType,
  resolveTypeArgumentsInType,
  serializeType,
  setParent,
  validate,
} from "../types/Type.ts"
import type { ValidatorHelpers } from "../validation/type.ts"
import type {
  BaseDecl,
  GetNestedDeclarations,
  SerializedBaseDecl,
  TypeArguments,
} from "./Declaration.ts"
import { getNestedDeclarations, getTypeArgumentsRecord, validateDeclName } from "./Declaration.ts"

export interface TypeAliasDecl<
  Name extends string = string,
  T extends Type = Type,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: NodeKind["TypeAliasDecl"]
  type: Lazy<T>
  isDeprecated?: boolean
}

export interface SerializedTypeAliasDecl<
  Name extends string = string,
  T extends SerializedType = SerializedType,
  Params extends SerializedTypeParameter[] = SerializedTypeParameter[],
> extends SerializedBaseDecl<Name, Params> {
  kind: NodeKind["TypeAliasDecl"]
  type: T
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
    type: Lazy.of(() => setParent(options.type(...options.parameters), decl)),
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
    type: Lazy.of(() => setParent(options.type(), decl)),
  }

  return decl
}

export { TypeAliasDecl as TypeAlias }

export const isTypeAliasDecl = (node: Node): node is TypeAliasDecl =>
  node.kind === NodeKind.TypeAliasDecl

export const getNestedDeclarationsInTypeAliasDecl: GetNestedDeclarations<TypeAliasDecl> = (
  addedDecls,
  decl,
) => getNestedDeclarations(addedDecls, decl.type.value)

export const validateTypeAliasDecl = <Params extends TypeParameter[]>(
  helpers: ValidatorHelpers,
  decl: TypeAliasDecl<string, Type, Params>,
  args: TypeArguments<Params>,
  value: unknown,
): Error[] =>
  validate(
    helpers,
    resolveTypeArgumentsInType(getTypeArgumentsRecord(decl, args), decl.type.value),
    value,
  )

export const resolveTypeArgumentsInTypeAliasDecl = <Params extends TypeParameter[]>(
  decl: TypeAliasDecl<string, Type, Params>,
  args: TypeArguments<Params>,
): TypeAliasDecl<string, Type, []> =>
  TypeAliasDecl(decl.sourceUrl, {
    ...decl,
    type: () => resolveTypeArgumentsInType(getTypeArgumentsRecord(decl, args), decl.type.value),
  })

export const serializeTypeAliasDecl: Serializer<TypeAliasDecl, SerializedTypeAliasDecl> = type => ({
  ...type,
  type: serializeType(type.type.value),
  parameters: type.parameters.map(param => serializeTypeParameter(param)),
})

export const getReferencesForTypeAliasDecl: GetReferences<TypeAliasDecl> = (decl, value) =>
  getReferencesForType(decl.type.value, value)
