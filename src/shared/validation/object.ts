import type { NumerusLabel} from "../utils/validation.js";
import { parallelizeErrors, validateLengthRangeBound } from "../utils/validation.js"

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
      ? actualKeys.flatMap(valueKey =>
          expectedKeys.includes(valueKey)
            ? []
            : [TypeError(`object does not allow unknown keys and key "${valueKey}" is not known`)],
        )
      : []),
  ])
}
