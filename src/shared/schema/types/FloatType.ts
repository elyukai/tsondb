import type { RangeBound } from "../../validation/number.ts"
import type { GetReferencesSerialized, NodeKind } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedFloatType extends SerializedBaseType {
  kind: NodeKind["FloatType"]
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

export const getReferencesForSerializedFloatType: GetReferencesSerialized<
  SerializedFloatType
> = () => []
