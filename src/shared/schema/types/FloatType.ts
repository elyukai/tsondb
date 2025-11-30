import type { NumberConstraints } from "../../validation/number.ts"
import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface FloatConstraints extends NumberConstraints {
  fractionDigits?: number
}

export const DEFAULT_FRACTION_DIGITS = 2

export interface SerializedFloatType extends SerializedBaseType, FloatConstraints {
  kind: NodeKind["FloatType"]
}

export const resolveTypeArgumentsInSerializedFloatType: SerializedTypeArgumentsResolver<
  SerializedFloatType
> = (_decls, _args, type) => type

export const getReferencesForSerializedFloatType: GetReferencesSerialized<
  SerializedFloatType
> = () => []
