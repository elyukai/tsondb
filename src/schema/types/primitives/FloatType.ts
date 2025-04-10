import { Node, NodeKind } from "../../Node.js"
import { parallelizeErrors, Validator } from "../../validation/type.js"
import { BaseType, Type } from "../Type.js"
import { RangeBound, validateMultipleOf, validateRangeBound } from "./NumericType.js"

export interface FloatType extends BaseType {
  kind: typeof NodeKind.FloatType
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
  kind: NodeKind.FloatType,
  ...options,
})

export { FloatType as Float }

export const isFloatType = (node: Node): node is FloatType => node.kind === NodeKind.FloatType

export const validateFloatType: Validator<FloatType> = (_helpers, type, value) => {
  if (typeof value !== "number") {
    return [TypeError(`Expected a floating-point number, but got ${JSON.stringify(value)}`)]
  }

  return parallelizeErrors([
    validateRangeBound("lower", type.minimum, value),
    validateRangeBound("upper", type.maximum, value),
    validateMultipleOf(type.multipleOf, value),
  ])
}
