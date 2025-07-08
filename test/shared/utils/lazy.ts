import { equal } from "assert"
import { describe, it } from "node:test"
import { Lazy } from "../../../src/shared/utils/lazy.js"

describe("Lazy", () => {
  it("should only evaluate the given expression when needed", () => {
    let count = 0
    const lazyValue = Lazy.of(() => ++count)
    equal(count, 0)
    equal(lazyValue.value, 1)
    equal(count, 1)
  })

  it("should only evaluate the given expression once", () => {
    let count = 0
    const lazyValue = Lazy.of(() => ++count)
    equal(lazyValue.value, 1)
    equal(lazyValue.value, 1)
  })
})
