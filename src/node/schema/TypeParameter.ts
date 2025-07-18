import type { Serializer } from "./Node.ts"
import { NodeKind } from "./Node.ts"
import type { SerializedBaseType, SerializedType, Type } from "./types/Type.ts"
import { removeParentKey, serializeType } from "./types/Type.ts"

export interface TypeParameter<N extends string = string, T extends Type = Type> {
  kind: NodeKind["GenericParameter"]
  name: N
  constraint?: T
}

export interface SerializedTypeParameter<
  N extends string = string,
  T extends SerializedType = SerializedType,
> extends SerializedBaseType {
  kind: NodeKind["GenericParameter"]
  name: N
  constraint?: T
}

export const Param = <N extends string = string, T extends Type = Type>(
  name: N,
  constraint?: T,
): TypeParameter<N, T> => ({
  kind: NodeKind.GenericParameter,
  name,
  constraint,
})

export const serializeTypeParameter: Serializer<TypeParameter, SerializedTypeParameter> = type => ({
  ...removeParentKey(type),
  constraint: type.constraint ? serializeType(type.constraint) : undefined,
})
