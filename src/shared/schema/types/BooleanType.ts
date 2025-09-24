import type { NodeKind } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedBooleanType extends SerializedBaseType {
  kind: NodeKind["BooleanType"]
}
