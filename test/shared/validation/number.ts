import { deepEqual, equal } from "node:assert/strict"
import { describe, it } from "node:test"
import {
  validateMultipleOf,
  validateNumberConstraints,
  validateRangeBound,
} from "../../../src/shared/validation/number.ts"

describe("validateNumberConstraints", () => {
  it("combines checks for bounds and multiple of", () => {
    deepEqual(validateNumberConstraints({}, 4), [])
    deepEqual(validateNumberConstraints({ minimum: 1, maximum: 6, multipleOf: 2 }, 4), [])
    deepEqual(validateNumberConstraints({ minimum: 1, maximum: 6, multipleOf: 2 }, -3), [
      RangeError(`expected a value greater than or equal 1, but got -3`),
      RangeError(`expected a value that is a multiple of 2, but got -3`),
    ])
  })
})

describe("validateRangeBound", () => {
  it("returns undefined if no range bound is defined", () => {
    equal(validateRangeBound("lower", undefined, 3), undefined)
    equal(validateRangeBound("upper", undefined, 3), undefined)
  })

  it("returns undefined if the number is within the given simple range bound", () => {
    equal(validateRangeBound("lower", 3, 4), undefined)
    equal(validateRangeBound("upper", 3, 2), undefined)
    equal(validateRangeBound("lower", 3, 3), undefined)
    equal(validateRangeBound("upper", 3, 3), undefined)
  })

  it("returns undefined if the number is within the given object range bound", () => {
    equal(validateRangeBound("lower", { value: 3, isExclusive: false }, 4), undefined)
    equal(validateRangeBound("upper", { value: 3, isExclusive: false }, 2), undefined)
    equal(validateRangeBound("lower", { value: 3, isExclusive: false }, 3), undefined)
    equal(validateRangeBound("upper", { value: 3, isExclusive: false }, 3), undefined)
    equal(validateRangeBound("lower", { value: 3, isExclusive: true }, 4), undefined)
    equal(validateRangeBound("upper", { value: 3, isExclusive: true }, 2), undefined)
  })

  it("returns an error if the number is not within the given simple range bound", () => {
    deepEqual(
      validateRangeBound("lower", 3, 2),
      RangeError(`expected a value greater than or equal 3, but got 2`),
    )
    deepEqual(
      validateRangeBound("upper", 3, 4),
      RangeError(`expected a value less than or equal 3, but got 4`),
    )
  })

  it("returns an error if the number is not within the given object range bound", () => {
    deepEqual(
      validateRangeBound("lower", { value: 3, isExclusive: false }, 2),
      RangeError(`expected a value greater than or equal 3, but got 2`),
    )
    deepEqual(
      validateRangeBound("upper", { value: 3, isExclusive: false }, 4),
      RangeError(`expected a value less than or equal 3, but got 4`),
    )
    deepEqual(
      validateRangeBound("lower", { value: 3, isExclusive: true }, 2),
      RangeError(`expected a value greater than 3, but got 2`),
    )
    deepEqual(
      validateRangeBound("upper", { value: 3, isExclusive: true }, 4),
      RangeError(`expected a value less than 3, but got 4`),
    )
    deepEqual(
      validateRangeBound("lower", { value: 3, isExclusive: true }, 3),
      RangeError(`expected a value greater than 3, but got 3`),
    )
    deepEqual(
      validateRangeBound("upper", { value: 3, isExclusive: true }, 3),
      RangeError(`expected a value less than 3, but got 3`),
    )
  })
})

describe("validateMultipleOf", () => {
  it("returns undefined if no multiple is defined", () => {
    equal(validateMultipleOf(undefined, 3), undefined)
  })

  it("returns undefined if the number is a multiple of the given number", () => {
    equal(validateMultipleOf(2, 4), undefined)
  })

  it("returns an error if the number is not a multiple of the given number", () => {
    deepEqual(
      validateMultipleOf(2, 3),
      RangeError(`expected a value that is a multiple of 2, but got 3`),
    )
  })
})
