import type { RangeBound } from "../../validation/number.ts"
import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedIntegerType extends SerializedBaseType {
  kind: NodeKind["IntegerType"]
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

export const resolveTypeArgumentsInSerializedIntegerType: SerializedTypeArgumentsResolver<
  SerializedIntegerType
> = (_decls, _args, type) => type

export const getReferencesForSerializedIntegerType: GetReferencesSerialized<
  SerializedIntegerType
> = () => []
