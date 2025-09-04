import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  combine,
  type Error,
  error,
  isError,
  isOk,
  map,
  mapError,
  ok,
  type Ok,
  reduce,
  type Result,
} from "../../../src/shared/utils/result.ts"

describe("ok", () => {
  it("creates a new ok result", () => {
    assert.deepEqual<Ok<string>>(ok("Success"), { tag: "Ok", value: "Success" })
  })

  it("creates a new ok result every time", () => {
    assert.notEqual(ok("Success"), ok("Success"))
  })
})

describe("error", () => {
  it("creates a new error result", () => {
    assert.deepEqual<Error<string>>(error("Error"), { tag: "Error", error: "Error" })
  })

  it("creates a new error result every time", () => {
    assert.notEqual(error("Error"), error("Error"))
  })
})

describe("isOk", () => {
  it("returns true for ok results", () => {
    assert.equal(isOk(ok("Success")), true)
  })

  it("returns false for error results", () => {
    assert.equal(isOk(error("Error")), false)
  })
})

describe("isError", () => {
  it("returns true for error results", () => {
    assert.equal(isError(error("Error")), true)
  })

  it("returns false for ok results", () => {
    assert.equal(isError(ok("Success")), false)
  })
})

describe("reduce", () => {
  it("reduces ok results to their value", () => {
    assert.equal(
      reduce(
        ok("Success"),
        v => v,
        e => e,
      ),
      "Success",
    )
  })

  it("reduces error results to their error", () => {
    assert.equal(
      reduce(
        error("Error"),
        v => v,
        e => e,
      ),
      "Error",
    )
  })
})

describe("map", () => {
  it("maps ok results to a new value", () => {
    const result: Result<string, string> = ok("Success")
    const mapped = map(result, v => v.length)
    assert.deepEqual(mapped, ok(7))
  })

  it("returns error results unchanged", () => {
    const result: Result<string, string> = error("Error")
    const mapped = map(result, v => v.length)
    assert.deepEqual(mapped, error("Error"))
  })
})

describe("mapError", () => {
  it("maps error results to a new error", () => {
    const result: Result<string, string> = error("Error")
    const mapped = mapError(result, v => v.length)
    assert.deepEqual(mapped, error(5))
  })

  it("returns ok results unchanged", () => {
    const result: Result<string, string> = ok("Success")
    const mapped = mapError(result, v => v.length)
    assert.deepEqual(mapped, ok("Success"))
  })
})

describe("combine", () => {
  it("combines two ok results into a new ok result", () => {
    const result1: Result<string, string> = ok("Success")
    const result2: Result<number, string> = ok(42)
    const combined = combine(
      result1,
      result2,
      (v1, v2) => `${v1} ${v2.toString()}`,
      (e1, e2) => `${e1} ${e2}`,
    )
    assert.deepEqual(combined, ok("Success 42"))
  })

  it("returns the error if only the first of the results is an error", () => {
    const result1: Result<string, string> = error("Error")
    const result2: Result<string, string> = ok("Success")
    const combined = combine(
      result1,
      result2,
      (v1, v2) => `${v1} ${v2}`,
      (e1, e2) => `${e1} ${e2}`,
    )
    assert.deepEqual(combined, error("Error"))
  })

  it("returns the error if only the second of the results is an error", () => {
    const result1: Result<string, string> = ok("Success")
    const result2: Result<string, string> = error("Error")
    const combined = combine(
      result1,
      result2,
      (v1, v2) => `${v1} ${v2}`,
      (e1, e2) => `${e1} ${e2}`,
    )
    assert.deepEqual(combined, error("Error"))
  })

  it("combines two error results into a new error result", () => {
    const result1: Result<string, string> = error("Error1")
    const result2: Result<string, string> = error("Error2")
    const combined = combine(
      result1,
      result2,
      (v1, v2) => `${v1} ${v2}`,
      (e1, e2) => `${e1} ${e2}`,
    )
    assert.deepEqual(combined, error("Error1 Error2"))
  })
})
