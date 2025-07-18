import { parallelizeErrors, validateLengthRangeBound } from "../utils/validation.ts"

export interface ArrayConstraints {
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
}

export const validateArrayConstraints = (constraints: ArrayConstraints, value: unknown[]) =>
  parallelizeErrors([
    validateLengthRangeBound("lower", "item", constraints.minItems, value),
    validateLengthRangeBound("upper", "item", constraints.maxItems, value),
    constraints.uniqueItems
      ? (() => {
          // if (typeof this.uniqueItems === "function") {
          //   const seen = new Set<any>()
          //   for (const item of value) {
          //     for (const other of seen) {
          //       if (this.uniqueItems(item, other)) {
          //         return TypeError(`Duplicate item found: ${JSON.stringify(item)}`)
          //       }
          //     }
          //     seen.add(item)
          //   }
          // } else {
          const seen = new Set()
          for (const item of value) {
            if (seen.has(item)) {
              return TypeError(`duplicate item found: ${JSON.stringify(item)}`)
            }
            seen.add(item)
          }
          return undefined
          // }
        })()
      : undefined,
  ])
