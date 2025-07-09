import type { RangeBound} from "../../../../shared/validation/number.js";
import { validateNumberConstraints } from "../../../../shared/validation/number.js"
import type { GetReferences, Node, Serializer } from "../../Node.js";
import { NodeKind } from "../../Node.js"
import type { Validator } from "../../validation/type.js"
import type { BaseType, SerializedBaseType, StructureFormatter } from "../Type.js";
import { removeParentKey } from "../Type.js"

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

export const validateFloatType: Validator<FloatType> = (_helpers, type, value) => {
  if (typeof value !== "number") {
    return [TypeError(`expected a floating-point number, but got ${JSON.stringify(value)}`)]
  }

  return validateNumberConstraints(type, value)
}

export const serializeFloatType: Serializer<FloatType, SerializedFloatType> = type =>
  removeParentKey(type)

export const getReferencesForFloatType: GetReferences<FloatType> = (_type, _value) => []

export const formatFloatValue: StructureFormatter<FloatType> = (_type, value) => value
