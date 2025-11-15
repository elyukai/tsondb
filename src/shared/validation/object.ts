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
  const label: NumerusLabel = ["property", "properties"]
  const actualKeys = Object.keys(value)
  return parallelizeErrors([
    validateLengthRangeBound("lower", label, constraints.minProperties, actualKeys),
    validateLengthRangeBound("upper", label, constraints.maxProperties, actualKeys),
    ...(constraints.additionalProperties !== true
      ? validateUnknownKeys(expectedKeys, actualKeys)
      : []),
  ])
}

export const validateUnknownKeys = (expectedKeys: string[], actualKeys: string[]) =>
  actualKeys.flatMap(valueKey =>
    expectedKeys.includes(valueKey)
      ? []
      : [TypeError(`object does not allow unknown keys and key "${valueKey}" is not known`)],
  )
