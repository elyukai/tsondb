import { deepEqual } from "node:assert/strict"
import { describe, it } from "node:test"
import {
  mergeObjects,
  sortObjectKeys,
  sortObjectKeysAlphabetically,
} from "../../../src/shared/utils/object.ts"

describe("sortObjectKeys", () => {
  it("should return an object with keys sorted in the order provided", () => {
    const original = { b: 2, a: 1 }
    const sorted = sortObjectKeys(original, ["a", "b", "c"])
    deepEqual(Object.keys(original), ["b", "a"])
    deepEqual(sorted, { a: 1, b: 2 })
    deepEqual(Object.keys(sorted), ["a", "b"])
  })
})

describe("sortObjectKeysAlphabetically", () => {
  it("should return an object with keys sorted alphabetically", () => {
    const original = { b: 2, a: 1, c: 3 }
    const sorted = sortObjectKeysAlphabetically(original)
    deepEqual(Object.keys(original), ["b", "a", "c"])
    deepEqual(sorted, { a: 1, b: 2, c: 3 })
    deepEqual(Object.keys(sorted), ["a", "b", "c"])
  })
})

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
