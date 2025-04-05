import { NodeKind } from "../Node.js"
import { Type } from "../Type.js"
import { RangeBound } from "./NumericType.js"

export interface FloatType {
  kind: typeof NodeKind.FloatType
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

export const Float = (
  options: {
    minimum?: RangeBound
    maximum?: RangeBound
    multipleOf?: number
  } = {},
): FloatType => ({
  kind: NodeKind.FloatType,
  ...options,
})

export const isFloatType = (type: Type): type is FloatType => type.kind === NodeKind.FloatType

export const validateFloatType = (typeDefinition: FloatType, value: unknown): void => {
  if (typeof value !== "number") {
    throw new TypeError(`Expected a floating-point number, but got ${JSON.stringify(value)}`)
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
