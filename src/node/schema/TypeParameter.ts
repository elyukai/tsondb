import type {
  Copier,
  GetNestedDeclarations,
  GetReferences,
  Serializer,
  TypeArgumentsResolver,
} from "./Node.ts"
import { copyType, getNestedDeclarations, NodeKind, serializeNode } from "./Node.ts"
import type { Type } from "./types/Type.ts"

export interface TypeParameter<N extends string = string, T extends Type = Type> {
  kind: NodeKind["TypeParameter"]
  name: N
  constraint?: T
}

export const Param = <N extends string = string, T extends Type = Type>(
  name: N,
  constraint?: T,
): TypeParameter<N, T> => ({
  kind: NodeKind.TypeParameter,
  name,
  constraint,
})

export const getNestedDeclarationsInTypeParameter: GetNestedDeclarations<TypeParameter> = (
  addedDecls,
  param,
) => (param.constraint ? getNestedDeclarations(addedDecls, param.constraint) : addedDecls)

export const resolveTypeArgumentsInTypeParameter: TypeArgumentsResolver<TypeParameter> = (
  _args,
  param,
) => param

export const serializeTypeParameter: Serializer<TypeParameter> = type => ({
  ...type,
  constraint: type.constraint ? serializeNode(type.constraint) : undefined,
})

export const getReferencesForTypeParameter: GetReferences<TypeParameter> = () => []

export const copyTypeParameterNode: Copier<TypeParameter> = param => ({
  ...param,
  constraint: param.constraint ? copyType(param.constraint) : undefined,
})
