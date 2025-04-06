import { Node, NodeKind } from "../../Node.js"
import { validateOption } from "../../validation/options.js"
import { BaseType } from "../Type.js"
import { RangeBound } from "./NumericType.js"

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

export const validateIntegerType = (typeDefinition: IntegerType, value: unknown): void => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new TypeError(`Expected an integer, but got ${JSON.stringify(value)}`)
  }

  if (typeDefinition.minimum !== undefined) {
    if (typeof typeDefinition.minimum === "number") {
      if (value < typeDefinition.minimum) {
        throw new RangeError(
          `Expected a value greater than or equal to ${typeDefinition.minimum}, but got ${value}`,
        )
      }
    } else if (typeDefinition.minimum.isExclusive) {
      if (value <= typeDefinition.minimum.value) {
        throw new RangeError(
          `Expected a value greater than ${typeDefinition.minimum.value}, but got ${value}`,
        )
      }
    } else {
      if (value < typeDefinition.minimum.value) {
        throw new RangeError(
          `Expected a value greater than or equal to ${typeDefinition.minimum.value}, but got ${value}`,
        )
      }
    }
  }

  if (typeDefinition.maximum !== undefined) {
    if (typeof typeDefinition.maximum === "number") {
      if (value > typeDefinition.maximum) {
        throw new RangeError(
          `Expected a value less than or equal to ${typeDefinition.maximum}, but got ${value}`,
        )
      }
    } else if (typeDefinition.maximum.isExclusive) {
      if (value >= typeDefinition.maximum.value) {
        throw new RangeError(
          `Expected a value less than ${typeDefinition.maximum.value}, but got ${value}`,
        )
      }
    } else {
      if (value > typeDefinition.maximum.value) {
        throw new RangeError(
          `Expected a value less than or equal to ${typeDefinition.maximum.value}, but got ${value}`,
        )
      }
    }
  }

  if (typeDefinition.multipleOf !== undefined && value % typeDefinition.multipleOf !== 0) {
    throw new RangeError(
      `Expected a value that is a multiple of ${typeDefinition.multipleOf}, but got ${value}`,
    )
  }
}
