import { gte, lte } from "./compare.js"

export const parallelizeErrors = (errors: (Error | undefined)[]): Error[] =>
  errors.filter(error => error !== undefined)

export type NumerusLabel = [singular: string, plural: string]

export const validateLengthRangeBound = (
  end: "lower" | "upper",
  label: string | NumerusLabel,
  rangeBound: number | undefined,
  value: unknown[],
): Error | undefined => {
  if (rangeBound === undefined) {
    return
  }

  const [operator, description] = end === "lower" ? [gte, "least"] : [lte, "most"]

  const length = value.length

  const normalizedLabel = Array.isArray(label) ? label : ([label, label + "s"] as NumerusLabel)

  if (!operator(length, rangeBound)) {
    return RangeError(
      `Expected at ${description} ${rangeBound} ${
        normalizedLabel[rangeBound === 1 ? 0 : 1]
      }, but got ${length} ${normalizedLabel[length === 1 ? 0 : 1]}`,
    )
  }

  return
}
