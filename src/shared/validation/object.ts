import { NumerusLabel, parallelizeErrors, validateLengthRangeBound } from "../utils/validation.js"

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
  return parallelizeErrors([
    validateLengthRangeBound("lower", label, constraints.minProperties, expectedKeys),
    validateLengthRangeBound("upper", label, constraints.maxProperties, expectedKeys),
    ...(constraints.additionalProperties !== true
      ? Object.keys(value).flatMap(valueKey =>
          expectedKeys.includes(valueKey)
            ? []
            : [TypeError(`object does not allow unknown keys and key "${valueKey}" is not known`)],
        )
      : []),
  ])
}
