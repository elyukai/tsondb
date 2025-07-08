import { deepEqual } from "node:assert/strict"
import { describe, it } from "node:test"
import { validateArrayConstraints } from "../../../src/shared/validation/array.js"

describe("validateArrayConstraints", () => {
  it("combines checks for bounds and uniqueness", () => {
    deepEqual(validateArrayConstraints({}, [1, 2, 3]), [])
    deepEqual(
      validateArrayConstraints({ minItems: 1, maxItems: 3, uniqueItems: true }, [1, 2, 3]),
      [],
    )
    deepEqual(validateArrayConstraints({ minItems: 1, maxItems: 3 }, [1, 2, 3, 3]), [
      RangeError(`expected at most 3 items, but got 4 items`),
    ])
    deepEqual(
      validateArrayConstraints({ minItems: 1, maxItems: 3, uniqueItems: true }, [1, 2, 3, 3]),
      [
        RangeError(`expected at most 3 items, but got 4 items`),
        TypeError(`duplicate item found: 3`),
      ],
    )
  })
})
