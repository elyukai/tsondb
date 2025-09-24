import type { RangeBound } from "../../validation/number.ts"
import type { NodeKind } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedFloatType extends SerializedBaseType {
  kind: NodeKind["FloatType"]
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}
