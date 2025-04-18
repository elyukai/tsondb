import { gt, gte, lt, lte } from "../../../utils/compare.js"
import { FloatType, SerializedFloatType } from "./FloatType.js"
import { IntegerType, SerializedIntegerType } from "./IntegerType.js"

export type RangeBound = number | { value: number; isExclusive: boolean }

export type NumericType = FloatType | IntegerType
export type SerializedNumericType = SerializedFloatType | SerializedIntegerType

export * from "./FloatType.js"
export * from "./IntegerType.js"

const normalizeRangeBound = (rangeBound: RangeBound): { value: number; isExclusive: boolean } =>
  typeof rangeBound === "number" ? { value: rangeBound, isExclusive: false } : rangeBound

export const validateRangeBound = (
  end: "lower" | "upper",
  rangeBound: RangeBound | undefined,
  value: number,
): Error | undefined => {
  if (rangeBound === undefined) {
    return
  }

  const normalizedRangeBound = normalizeRangeBound(rangeBound)

  const [operator, description] =
    end === "lower"
      ? normalizedRangeBound.isExclusive
        ? [gt, "greater than"]
        : [gte, "greater than or equal"]
      : normalizedRangeBound.isExclusive
      ? [lt, "less than"]
      : [lte, "less than or equal"]

  if (operator(value, normalizedRangeBound.value)) {
    return RangeError(
      `expected a value ${description} ${normalizedRangeBound.value}, but got ${value}`,
    )
  }

  return
}

export const validateMultipleOf = (
  multipleOf: number | undefined,
  value: number,
): Error | undefined => {
  if (multipleOf === undefined) {
    return
  }

  if (value % multipleOf !== 0) {
    return RangeError(`expected a value that is a multiple of ${multipleOf}, but got ${value}`)
  }

  return
}
