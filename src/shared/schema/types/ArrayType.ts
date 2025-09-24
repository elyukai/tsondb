import type { NodeKind } from "../Node.ts"
import type { SerializedBaseType, SerializedType } from "./Type.ts"

export interface SerializedArrayType<T extends SerializedType = SerializedType>
  extends SerializedBaseType {
  kind: NodeKind["ArrayType"]
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  items: T
}
