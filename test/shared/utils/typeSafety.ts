import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { assertExhaustive } from "../../../src/shared/utils/typeSafety.js"

describe("assertExhaustive", () => {
  it("should throw an error with the message 'The switch is not exhaustive.'", () => {
    assert.throws(
      // @ts-expect-error The function should never receive a value.
      () => assertExhaustive(""),
      err => err instanceof Error && err.message === "The switch is not exhaustive.",
    )
  })

  it("should throw an error with a custom message", () => {
    assert.throws(
      // @ts-expect-error The function should never receive a value.
      () => assertExhaustive("", "Custom error message"),
      err => err instanceof Error && err.message === "Custom error message",
    )
  })
})
