import type { RangeBound } from "../../validation/number.ts"
import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedFloatType extends SerializedBaseType {
  kind: NodeKind["FloatType"]
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

export const resolveTypeArgumentsInSerializedFloatType: SerializedTypeArgumentsResolver<
  SerializedFloatType
> = (_decls, _args, type) => type

export const getReferencesForSerializedFloatType: GetReferencesSerialized<
  SerializedFloatType
> = () => []
