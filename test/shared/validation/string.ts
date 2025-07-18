import { deepEqual } from "node:assert/strict"
import { describe, it } from "node:test"
import { validateStringConstraints } from "../../../src/shared/validation/string.ts"

describe("validateStringConstraints", () => {
  it("combines checks for bounds and multiple of", () => {
    deepEqual(validateStringConstraints({}, "lorem ipsum"), [])
    deepEqual(validateStringConstraints({ minLength: 1, maxLength: 20 }, "lorem ipsum"), [])
    deepEqual(validateStringConstraints({ minLength: 1, maxLength: 6 }, ""), [
      RangeError(`expected a string with at least 1 character, but got 0 characters`),
    ])
    deepEqual(validateStringConstraints({ minLength: 1, maxLength: 1 }, "lorem ipsum"), [
      RangeError(`expected a string with at most 1 character, but got 11 characters`),
    ])
    deepEqual(validateStringConstraints({ minLength: 1, maxLength: 6 }, "lorem ipsum"), [
      RangeError(`expected a string with at most 6 characters, but got 11 characters`),
    ])
    deepEqual(validateStringConstraints({ maxLength: 0 }, "l"), [
      RangeError(`expected a string with at most 0 characters, but got 1 character`),
    ])
    deepEqual(validateStringConstraints({ minLength: 2, maxLength: 6 }, "l"), [
      RangeError(`expected a string with at least 2 characters, but got 1 character`),
    ])
    deepEqual(validateStringConstraints({ minLength: 20, maxLength: 120 }, "lorem ipsum"), [
      RangeError(`expected a string with at least 20 characters, but got 11 characters`),
    ])
    deepEqual(validateStringConstraints({ pattern: "\\w+" }, "lorem ipsum"), [])
    deepEqual(validateStringConstraints({ pattern: /\w+/ }, "lorem ipsum"), [])
    deepEqual(validateStringConstraints({ pattern: "\\w+" }, " "), [
      TypeError(`string does not match the pattern /\\w+/`),
    ])
    deepEqual(validateStringConstraints({ pattern: /\w+/ }, " "), [
      TypeError(`string does not match the pattern /\\w+/`),
    ])
  })
})
