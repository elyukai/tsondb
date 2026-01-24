import { gte, lte } from "@elyukai/utils/equality"

export const parallelizeErrors = (errors: (Error | undefined)[]): Error[] =>
  errors.filter(error => error !== undefined)

export type NumerusLabel = [singular: string, plural: string]

const normalizeLabel = (label: string | NumerusLabel): NumerusLabel =>
  Array.isArray(label) ? label : [label, label + "s"]

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
  const normalizedLabel = normalizeLabel(label)

  if (!operator(length, rangeBound)) {
    return RangeError(
      `expected at ${description} ${rangeBound.toString()} ${
        normalizedLabel[rangeBound === 1 ? 0 : 1]
      }, but got ${length.toString()} ${normalizedLabel[length === 1 ? 0 : 1]}`,
    )
  }

  return
}
