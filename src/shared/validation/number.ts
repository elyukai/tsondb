import { gt, gte, lt, lte } from "@elyukai/utils/equality"
import { parallelizeErrors } from "../utils/validation.ts"

export interface NumberConstraints {
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

export const validateNumberConstraints = (constraints: NumberConstraints, value: number) =>
  parallelizeErrors([
    validateRangeBound("lower", constraints.minimum, value),
    validateRangeBound("upper", constraints.maximum, value),
    validateMultipleOf(constraints.multipleOf, value),
  ])

export type RangeBound = number | { value: number; isExclusive: boolean }

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

  if (!operator(value, normalizedRangeBound.value)) {
    return RangeError(
      `expected a value ${description} ${normalizedRangeBound.value.toString()}, but got ${value.toString()}`,
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
    return RangeError(
      `expected a value that is a multiple of ${multipleOf.toString()}, but got ${value.toString()}`,
    )
  }

  return
}
