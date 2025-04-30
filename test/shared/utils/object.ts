import { deepEqual } from "assert/strict"
import { describe, it } from "node:test"
import { mergeObjects } from "../../../src/shared/utils/object.js"

describe("mergeObjects", () => {
  it("should merge keys from both objects into a single one", () => {
    deepEqual(
      mergeObjects({ a: 1 }, { b: 2 }, (a, b) => a + b),
      { a: 1, b: 2 },
    )
  })

  it("should merge keys that exist on both objects using the provided function", () => {
    deepEqual(
      mergeObjects({ a: 1, b: 3 }, { b: 2 }, (a, b) => a + b),
      { a: 1, b: 5 },
    )
  })
})
