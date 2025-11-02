import { equal } from "assert/strict"
import { describe, it } from "node:test"
import {
  detectIndentation,
  removeIndentation,
} from "../../../../src/shared/utils/markdown/indentation.ts"

describe("detectIndentation", () => {
  it("detects the indentation from the first line", () => {
    equal<number>(detectIndentation("test\n  test"), 0)
    equal<number>(detectIndentation("  test\n  test"), 2)
    equal<number>(detectIndentation("  test\n test"), 2)
  })

  it("optionally detects the indentation from the second line", () => {
    equal<number>(detectIndentation("test\n  test", true), 2)
    equal<number>(detectIndentation("  test\n  test", true), 2)
    equal<number>(detectIndentation("  test\ntest", true), 0)
  })

  it("ignores empty lines", () => {
    equal<number>(detectIndentation("\n  test"), 2)
    equal<number>(detectIndentation("test\n\n  test", true), 2)
  })
})

describe("removeIndentation", () => {
  it("detects the indentation from the first line and removes that indentation from every line of the text", () => {
    equal<string>(removeIndentation("  test\n  test\n    test"), "test\ntest\n  test")
  })

  it("detects the indentation from the second line and removes that indentation from every line of the text", () => {
    equal<string>(removeIndentation("test\n  test\n    test", true), "test\ntest\n  test")
  })

  it("receives a fixed indentation and removes that indentation from every line of the text", () => {
    equal<string>(
      removeIndentation("    test\n    test\n    test", undefined, 2),
      "  test\n  test\n  test",
    )
  })
})
