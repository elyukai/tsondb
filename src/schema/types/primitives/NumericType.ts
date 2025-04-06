import { gt, gte, lt, lte } from "../../../utils/compare.js"
import { FloatType } from "./FloatType.js"
import { IntegerType } from "./IntegerType.js"

export type RangeBound = number | { value: number; isExclusive: boolean }

export type NumericType = FloatType | IntegerType

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
      `Expected a value ${description} ${normalizedRangeBound.value}, but got ${value}`,
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
    return RangeError(`Expected a value that is a multiple of ${multipleOf}, but got ${value}`)
  }

  return
}
