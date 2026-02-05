import type { NumerusLabel } from "../utils/validation.ts"
import { parallelizeErrors, validateLengthRangeBound } from "../utils/validation.ts"

export interface ObjectConstraints {
  additionalProperties?: boolean
  minProperties?: number
  maxProperties?: number
}

export const validateObjectConstraints = (
  constraints: ObjectConstraints,
  expectedKeys: string[],
  value: object,
) => {
  const actualKeys = Object.keys(value)
  return parallelizeErrors([
    ...validateObjectRangeConstraints(constraints, value),
    ...(constraints.additionalProperties !== true
      ? validateUnknownKeys(expectedKeys, actualKeys)
      : []),
  ])
}

const rangeLabel: NumerusLabel = ["property", "properties"]

export const validateObjectRangeConstraints = (
  constraints: Pick<ObjectConstraints, "minProperties" | "maxProperties">,
  value: object,
) => {
  const actualKeys = Object.keys(value)
  return parallelizeErrors([
    validateLengthRangeBound("lower", rangeLabel, constraints.minProperties, actualKeys),
    validateLengthRangeBound("upper", rangeLabel, constraints.maxProperties, actualKeys),
  ])
}

export const validateUnknownKeys = (expectedKeys: string[], actualKeys: string[]) =>
  actualKeys.flatMap(valueKey =>
    expectedKeys.includes(valueKey)
      ? []
      : [TypeError(`object does not allow unknown keys and key "${valueKey}" is not known`)],
  )
