import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getValueAtKeyPath } from "../../../../src/shared/schema/utils/keyPath.ts"

describe("getValueAtKeyPath", () => {
  it("should return the value at the specified key path", () => {
    const obj = {
      a: {
        b: [1, 2, 3],
        c: {
          d: "hello",
        },
      },
    }

    assert.deepEqual(getValueAtKeyPath(obj, ["a", "b", "1"]), 2)
    assert.deepEqual(getValueAtKeyPath(obj, ["a", "c", "d"]), "hello")
  })
})
