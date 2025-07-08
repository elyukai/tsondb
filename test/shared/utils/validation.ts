import { deepEqual, equal } from "node:assert/strict"
import { describe, it } from "node:test"
import {
  parallelizeErrors,
  validateLengthRangeBound,
} from "../../../src/shared/utils/validation.js"

describe("parallelizeErrors", () => {
  it("flattens possible errors into actual errors", () => {
    deepEqual(parallelizeErrors([]), [])
    deepEqual(
      parallelizeErrors([
        RangeError(`expected a value greater than or equal 1, but got -3`),
        undefined,
        RangeError(`expected a value that is a multiple of 2, but got -3`),
        undefined,
      ]),
      [
        RangeError(`expected a value greater than or equal 1, but got -3`),
        RangeError(`expected a value that is a multiple of 2, but got -3`),
      ],
    )
  })
})

describe("validateLengthRangeBound", () => {
  it("returns undefined if no range bound is defined", () => {
    equal(validateLengthRangeBound("lower", "item", undefined, [1, 2, 3]), undefined)
    equal(validateLengthRangeBound("upper", "item", undefined, [1, 2, 3]), undefined)
  })

  it("returns undefined if the number is within the given range bound", () => {
    equal(validateLengthRangeBound("lower", "item", 3, [1, 2, 3, 4]), undefined)
    equal(validateLengthRangeBound("upper", "item", 3, [1, 2]), undefined)
    equal(validateLengthRangeBound("lower", "item", 3, [1, 2, 3]), undefined)
    equal(validateLengthRangeBound("upper", "item", 3, [1, 2, 3]), undefined)
  })

  it("returns an error if the number is not within the given range bound", () => {
    deepEqual(
      validateLengthRangeBound("lower", "item", 3, [1, 2]),
      RangeError(`expected at least 3 items, but got 2 items`),
    )
    deepEqual(
      validateLengthRangeBound("lower", ["property", "properties"], 3, [1, 2]),
      RangeError(`expected at least 3 properties, but got 2 properties`),
    )
    deepEqual(
      validateLengthRangeBound("lower", ["property", "properties"], 3, [1]),
      RangeError(`expected at least 3 properties, but got 1 property`),
    )
    deepEqual(
      validateLengthRangeBound("lower", ["property", "properties"], 1, []),
      RangeError(`expected at least 1 property, but got 0 properties`),
    )
    deepEqual(
      validateLengthRangeBound("upper", "item", 3, [1, 2, 3, 4]),
      RangeError(`expected at most 3 items, but got 4 items`),
    )
  })
})
