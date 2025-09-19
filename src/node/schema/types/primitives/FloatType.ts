import type { RangeBound } from "../../../../shared/validation/number.ts"
import { validateNumberConstraints } from "../../../../shared/validation/number.ts"
import { json } from "../../../utils/errorFormatting.ts"
import type { GetReferences, GetReferencesSerialized, Node, Serializer } from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import type { Validator } from "../../validation/type.ts"
import type { BaseType, SerializedBaseType, StructureFormatter } from "../Type.ts"
import { removeParentKey } from "../Type.ts"

export interface FloatType extends BaseType {
  kind: NodeKind["FloatType"]
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

export interface SerializedFloatType extends SerializedBaseType {
  kind: NodeKind["FloatType"]
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

export const FloatType = (
  options: {
    minimum?: RangeBound
    maximum?: RangeBound
    multipleOf?: number
  } = {},
): FloatType => ({
  ...options,
  kind: NodeKind.FloatType,
})

export { FloatType as Float }

export const isFloatType = (node: Node): node is FloatType => node.kind === NodeKind.FloatType

export const validateFloatType: Validator<FloatType> = (helpers, type, value) => {
  if (typeof value !== "number") {
    return [
      TypeError(`expected a floating-point number, but got ${json(value, helpers.useStyling)}`),
    ]
  }

  return validateNumberConstraints(type, value)
}

export const serializeFloatType: Serializer<FloatType, SerializedFloatType> = type =>
  removeParentKey(type)

export const getReferencesForFloatType: GetReferences<FloatType> = (_type, _value) => []

export const getReferencesForSerializedFloatType: GetReferencesSerialized<SerializedFloatType> = (
  _type,
  _value,
) => []

export const formatFloatValue: StructureFormatter<FloatType> = (_type, value) => value
