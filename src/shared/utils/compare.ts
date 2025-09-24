export type ComparisonOperator = (a: number, b: number) => boolean

export const lt: ComparisonOperator = (a, b) => a < b
export const lte: ComparisonOperator = (a, b) => a <= b
export const gt: ComparisonOperator = (a, b) => a > b
export const gte: ComparisonOperator = (a, b) => a >= b
export const eq: ComparisonOperator = (a, b) => Object.is(a, b)
export const neq: ComparisonOperator = (a, b) => !Object.is(a, b)

/**
 * Checks two values for value equality. This is a deep equality check that
 * works for all types, including objects and arrays. For objects, it only
 * compares all enumerable keys, no other properties or the prototype chain.
 */
export const deepEqual = <T>(a: T, b: T): boolean => {
  if (Object.is(a, b)) {
    return true
  }

  if (typeof a === "object" && typeof b === "object" && a !== null && b !== null) {
    const keys = Object.keys(a)

    if (keys.length !== Object.keys(b).length) {
      return false
    }

    for (const key of keys) {
      if (!(key in b) || !deepEqual(a[key as keyof typeof a], b[key as keyof typeof b])) {
        return false
      }
    }

    return true
  }

  return false
}
