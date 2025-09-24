import type { NodeKind } from "./Node.ts"
import type { SerializedBaseType, SerializedType } from "./types/Type.ts"

export interface SerializedTypeParameter<
  N extends string = string,
  T extends SerializedType = SerializedType,
> extends SerializedBaseType {
  kind: NodeKind["TypeParameter"]
  name: N
  constraint?: T
}
