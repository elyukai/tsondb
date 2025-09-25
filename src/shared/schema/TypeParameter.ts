import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "./Node.ts"
import type { SerializedBaseType, SerializedType } from "./types/Type.ts"

export interface SerializedTypeParameter<
  N extends string = string,
  T extends SerializedType = SerializedType,
> extends SerializedBaseType {
  kind: NodeKind["TypeParameter"]
  name: N
  constraint?: T
}

export const resolveTypeArgumentsInSerializedTypeParameter: SerializedTypeArgumentsResolver<
  SerializedTypeParameter
> = (_decls, _args, param) => param

export const getReferencesForSerializedTypeParameter: GetReferencesSerialized<
  SerializedTypeParameter
> = () => []
