import { deepEqual, throws } from "assert/strict"
import { describe, it } from "node:test"
import { difference, insertAt, removeAt } from "../../../src/shared/utils/array.js"

describe("removeAt", () => {
  it("removes an element at the given index", () => {
    deepEqual(removeAt([1, 2, 3, 4, 5], 2), [1, 2, 4, 5])
  })

  it("removes an element at the given index without affecting the original array", () => {
    const original = [1, 2, 3, 4, 5]
    const result = removeAt(original, 2)
    deepEqual(result, [1, 2, 4, 5])
    deepEqual(original, [1, 2, 3, 4, 5])
  })

  it("throws an error if the index is out of bounds", () => {
    throws(() => removeAt([1, 2, 3], -1), RangeError)
    throws(() => removeAt([1, 2, 3], 3), RangeError)
  })
})

describe("insertAt", () => {
  it("inserts an element at the given index", () => {
    deepEqual(insertAt([1, 2, 3, 4, 5], 3, 3.5), [1, 2, 3, 3.5, 4, 5])
  })

  it("inserts an element at the given index without affecting the original array", () => {
    const original = [1, 2, 3, 4, 5]
    const result = insertAt(original, 3, 3.5)
    deepEqual(result, [1, 2, 3, 3.5, 4, 5])
    deepEqual(original, [1, 2, 3, 4, 5])
  })

  it("inserts an element at the end of the array if the index is equal to the length", () => {
    deepEqual(insertAt([1, 2, 3], 3, 4), [1, 2, 3, 4])
  })

  it("throws an error if the index is out of bounds", () => {
    throws(() => insertAt([1, 2, 3], -1, 0), RangeError)
    throws(() => insertAt([1, 2, 3], 4, 0), RangeError)
  })
})

describe("difference", () => {
  it("only evaluates the given expression when needed", () => {
    deepEqual(difference([1, 2, 3, 4, 4], [2, 3, 4, 5]), { added: [5], removed: [1, 4] })
  })
})
