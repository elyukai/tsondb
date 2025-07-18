import { deepEqual } from "node:assert/strict"
import { describe, it } from "node:test"
import { enumOfObject } from "../../../src/shared/utils/enum.ts"

describe("enumOfObject", () => {
  it("creates a frozen object with the keys equaling their values", () => {
    const obj = {
      A: null,
      B: null,
      C: null,
    }

    deepEqual(enumOfObject(obj), Object.fromEntries(Object.keys(obj).map(key => [key, key])))
  })
})
