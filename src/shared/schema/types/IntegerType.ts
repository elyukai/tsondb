import type { RangeBound } from "../../validation/number.ts"
import type { GetReferencesSerialized, NodeKind } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedIntegerType extends SerializedBaseType {
  kind: NodeKind["IntegerType"]
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

export const getReferencesForSerializedIntegerType: GetReferencesSerialized<
  SerializedIntegerType
> = () => []
