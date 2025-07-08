import { deepEqual } from "node:assert/strict"
import { describe, it } from "node:test"
import { validateDateConstraints } from "../../../src/shared/validation/date.js"

describe("validateDateConstraints", () => {
  it("checks the pattern of the date string without time by default or if explicitly disabled", () => {
    deepEqual(validateDateConstraints({}, "2025-01-02"), [])
    deepEqual(validateDateConstraints({ time: false }, "2025-01-02"), [])
    deepEqual(validateDateConstraints({}, "2025/01/02"), [
      TypeError(`invalid ISO 8601 date-only string: 2025/01/02`),
    ])
  })

  it("checks the pattern of the date string with time if explicitly enabled", () => {
    deepEqual(validateDateConstraints({ time: true }, "2025-01-02T12:34:56"), [])
    deepEqual(validateDateConstraints({ time: true }, "2025/01/02,12:34:56"), [
      TypeError(`invalid ISO 8601 date time string: 2025/01/02,12:34:56`),
    ])
  })
})
