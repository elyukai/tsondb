import { Node, NodeKind } from "../../Node.js"
import { validateOption } from "../../validation/options.js"
import { parallelizeErrors, Validator } from "../../validation/type.js"
import { BaseType } from "../Type.js"
import { RangeBound, validateMultipleOf, validateRangeBound } from "./NumericType.js"

export interface IntegerType extends BaseType {
  kind: typeof NodeKind.IntegerType
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

const isIntegerRangeBoundOption = (option: RangeBound) =>
  Number.isInteger(typeof option === "number" ? option : option.value)

export const Integer = (
  options: {
    minimum?: RangeBound
    maximum?: RangeBound
    multipleOf?: number
  } = {},
): IntegerType => ({
  kind: NodeKind.IntegerType,
  minimum: validateOption(options.minimum, "minimum", isIntegerRangeBoundOption),
  maximum: validateOption(options.maximum, "maximum", isIntegerRangeBoundOption),
  multipleOf: options.multipleOf,
})

export const isIntegerType = (node: Node): node is IntegerType => node.kind === NodeKind.IntegerType

export const validateIntegerType: Validator<IntegerType> = (_helpers, type, value) => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return [TypeError(`Expected an integer, but got ${JSON.stringify(value)}`)]
  }

  return parallelizeErrors([
    validateRangeBound("lower", type.minimum, value),
    validateRangeBound("upper", type.maximum, value),
    validateMultipleOf(type.multipleOf, value),
  ])
}
