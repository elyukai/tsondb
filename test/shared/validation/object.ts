import { deepEqual } from "node:assert/strict"
import { describe, it } from "node:test"
import { validateObjectConstraints } from "../../../src/shared/validation/object.js"

describe("validateObjectConstraints", () => {
  it("combines checks for bounds and additional properties", () => {
    deepEqual(validateObjectConstraints({}, ["a", "b", "c"], { a: 1, b: 2 }), [])
    deepEqual(
      validateObjectConstraints(
        { minProperties: 1, maxProperties: 2, additionalProperties: false },
        ["a", "b", "c"],
        { a: 1, b: 2 },
      ),
      [],
    )
    deepEqual(
      validateObjectConstraints(
        { minProperties: 1, maxProperties: 2, additionalProperties: true },
        ["a", "b"],
        { a: 1, b: 2, c: 3 },
      ),
      [RangeError(`expected at most 2 properties, but got 3 properties`)],
    )
    deepEqual(
      validateObjectConstraints(
        { minProperties: 1, maxProperties: 2, additionalProperties: false },
        ["a", "b"],
        { a: 1, b: 2, c: 3 },
      ),
      [
        RangeError(`expected at most 2 properties, but got 3 properties`),
        TypeError(`object does not allow unknown keys and key "c" is not known`),
      ],
    )
  })
})
