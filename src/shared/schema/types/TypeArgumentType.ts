import type { NodeKind } from "../Node.ts"
import type { SerializedTypeParameter } from "../TypeParameter.ts"
import type { SerializedBaseType } from "./Type.ts"

type TSerializedConstraint = SerializedTypeParameter

export interface SerializedTypeArgumentType<T extends TSerializedConstraint = TSerializedConstraint>
  extends SerializedBaseType {
  kind: NodeKind["TypeArgumentType"]
  argument: T
}
