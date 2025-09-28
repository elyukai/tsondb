import { deepEqual, throws } from "assert/strict"
import { describe, it } from "node:test"
import { difference, insertAt, removeAt, reorder, unique } from "../../../src/shared/utils/array.ts"

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

describe("unique", () => {
  it("returns an empty array when given an empty array", () => {
    deepEqual(unique([]), [])
  })

  it("removes duplicate values from the array using shallow equality checks", () => {
    deepEqual(unique([1, 2, 2, 3, 4, 4]), [1, 2, 3, 4])
  })

  it("removes duplicate values from the array using custom equality checks", () => {
    const arr = [{ id: 1 }, { id: 2 }, { id: 1 }]
    const equalityCheck = (a: { id: number }, b: { id: number }) => a.id === b.id
    deepEqual(unique(arr, equalityCheck), [{ id: 1 }, { id: 2 }])
  })
})

describe("reorder", () => {
  it("reorders an element from sourceIndex to targetIndex", () => {
    deepEqual(reorder([1, 2, 3, 4, 5], 1, 3), [1, 3, 4, 2, 5])
    deepEqual(reorder([1, 2, 3, 4, 5], 3, 1), [1, 4, 2, 3, 5])
    deepEqual(reorder([1, 2, 3, 4, 5], 0, 4), [2, 3, 4, 5, 1])
    deepEqual(reorder([1, 2, 3, 4, 5], 4, 0), [5, 1, 2, 3, 4])
    deepEqual(reorder([1, 2, 3, 4, 5], 2, 2), [1, 2, 3, 4, 5])
  })

  it("throws an error if the sourceIndex is out of bounds", () => {
    throws(() => reorder([1, 2, 3], -1, 0), RangeError)
    throws(() => reorder([1, 2, 3], 3, 0), RangeError)
  })

  it("throws an error if the targetIndex is out of bounds", () => {
    throws(() => reorder([1, 2, 3], 0, -1), RangeError)
    throws(() => reorder([1, 2, 3], 0, 3), RangeError)
  })
})
