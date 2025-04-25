import { deepEqual } from "assert/strict"
import { describe, it } from "node:test"
import { difference } from "../../../src/shared/utils/array.js"

describe("difference", () => {
  it("should only evaluate the given expression when needed", () => {
    deepEqual(difference([1, 2, 3, 4, 4], [2, 3, 4, 5]), { added: [5], removed: [1, 4] })
  })
})
