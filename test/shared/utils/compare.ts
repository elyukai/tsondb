import { deepEqual } from "assert/strict"
import { describe, it } from "node:test"
import {
  deepEqual as deepEqualFn,
  eq,
  gt,
  gte,
  lt,
  lte,
  neq,
} from "../../../src/shared/utils/compare.ts"

describe("lt", () => {
  it("equals true if the first number is less than the second", () => {
    deepEqual(lt(1, 2), true)
  })

  it("equals false if the first number is greater than or equal to the second", () => {
    deepEqual(lt(2, 1), false)
    deepEqual(lt(2, 2), false)
  })
})

describe("lte", () => {
  it("equals true if the first number is less than or equal to the second", () => {
    deepEqual(lte(1, 2), true)
    deepEqual(lte(2, 2), true)
  })

  it("equals false if the first number is greater than the second", () => {
    deepEqual(lte(2, 1), false)
  })
})

describe("gt", () => {
  it("equals true if the first number is greater than the second", () => {
    deepEqual(gt(2, 1), true)
  })

  it("equals false if the first number is less than or equal to the second", () => {
    deepEqual(gt(1, 2), false)
    deepEqual(gt(2, 2), false)
  })
})

describe("gte", () => {
  it("equals true if the first number is greater than or equal to the second", () => {
    deepEqual(gte(2, 1), true)
    deepEqual(gte(2, 2), true)
  })

  it("equals false if the first number is less than the second", () => {
    deepEqual(gte(1, 2), false)
  })
})

describe("eq", () => {
  it("equals true if the first number is equal to the second", () => {
    deepEqual(eq(2, 2), true)
  })

  it("equals false if the first number is not equal to the second", () => {
    deepEqual(eq(1, 2), false)
    deepEqual(eq(2, 1), false)
  })
})

describe("neq", () => {
  it("equals true if the first number is not equal to the second", () => {
    deepEqual(neq(1, 2), true)
    deepEqual(neq(2, 1), true)
  })

  it("equals false if the first number is equal to the second", () => {
    deepEqual(neq(2, 2), false)
  })
})

describe("deepEqual", () => {
  it("returns true for two equal values", () => {
    deepEqual(deepEqualFn(1, 1), true)
    deepEqual(deepEqualFn("test", "test"), true)
    deepEqual(deepEqualFn([1, 2, 3], [1, 2, 3]), true)
    deepEqual(deepEqualFn({ a: 1, b: 2 }, { a: 1, b: 2 }), true)
  })

  it("returns false for two different values", () => {
    deepEqual(deepEqualFn(1, 2), false)
    deepEqual(deepEqualFn("test", "TEST"), false)
    deepEqual(deepEqualFn([1, 2], [2, 3]), false)
    deepEqual(deepEqualFn({ a: 1 }, { a: 2 }), false)
    deepEqual(deepEqualFn({ a: 1, b: 2 }, { a: 2 }), false)
  })
})
