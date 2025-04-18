import { GetReferences, Node, NodeKind, Serializer } from "../../Node.js"
import { parallelizeErrors, Validator } from "../../validation/type.js"
import { BaseType, removeParentKey, SerializedBaseType, Type } from "../Type.js"
import { RangeBound, validateMultipleOf, validateRangeBound } from "./NumericType.js"

export interface FloatType extends BaseType {
  kind: NodeKind["FloatType"]
  parent?: Type
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

export interface SerializedFloatType extends SerializedBaseType {
  kind: NodeKind["FloatType"]
  parent?: Type
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

  return parallelizeErrors([
    validateRangeBound("lower", type.minimum, value),
    validateRangeBound("upper", type.maximum, value),
    validateMultipleOf(type.multipleOf, value),
  ])
}

export const serializeFloatType: Serializer<FloatType, SerializedFloatType> = type =>
  removeParentKey(type)

export const getReferencesForFloatType: GetReferences<FloatType> = (_type, _value) => []
