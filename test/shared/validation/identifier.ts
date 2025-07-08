import { deepEqual } from "node:assert/strict"
import { describe, it } from "node:test"
import { validateLocaleIdentifier } from "../../../src/shared/validation/identifier.js"

describe("validateLocaleIdentifier", () => {
  it("returns an empty array if the locale identifier is valid", () => {
    deepEqual(validateLocaleIdentifier("en"), [])
    deepEqual(validateLocaleIdentifier("en-US"), [])
  })

  it("returns an array with an error if the locale identifier is invalid", () => {
    deepEqual(validateLocaleIdentifier("en_US"), [TypeError(`invalid locale identifier: "en_US"`)])
    deepEqual(validateLocaleIdentifier("abcde-fghijkl-mnopqr-stuvwxyz"), [
      TypeError(`invalid locale identifier: "abcde-fghijkl-mnopqr-stuvwxyz"`),
    ])
  })
})
