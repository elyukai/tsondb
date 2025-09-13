import { deepEqual, equal, notEqual } from "assert/strict"
import { describe, it } from "node:test"
import {
  FloatType,
  formatFloatValue,
  getReferencesForFloatType,
  isFloatType,
  NodeKind,
  serializeFloatType,
  StringType,
  validateFloatType,
} from "../../../../../src/node/schema/index.ts"
import { json } from "../../../../../src/node/utils/errorFormatting.ts"

describe("constructor", () => {
  it("should create a new Float type", () => {
    deepEqual(FloatType(), { kind: NodeKind.FloatType })
    deepEqual(FloatType({ minimum: 2 }), { kind: NodeKind.FloatType, minimum: 2 })
  })

  it("should always create a new object", () => {
    notEqual(FloatType(), FloatType())
  })
})

describe("predicate", () => {
  it("returns if the node is a FloatType", () => {
    equal(isFloatType(FloatType()), true)
    equal(isFloatType(StringType()), false)
  })
})

describe("validateFloatType", () => {
  it("returns if the value is a valid FloatType", () => {
    deepEqual(
      validateFloatType(
        { checkReferentialIntegrity: () => [], useStyling: true },
        FloatType(),
        1.0,
      ),
      [],
    )
    deepEqual(
      validateFloatType(
        { checkReferentialIntegrity: () => [], useStyling: true },
        FloatType(),
        "true",
      ),
      [TypeError(`expected a floating-point number, but got ${json("true", true)}`)],
    )
  })
})

describe("serializeFloatType", () => {
  it("returns a serializable FloatType", () => {
    deepEqual(
      serializeFloatType({
        parent: StringType(),
        kind: NodeKind.FloatType,
      }),
      {
        kind: NodeKind.FloatType,
      },
    )
  })
})

describe("getReferencesForFloatType", () => {
  it("returns the references in the value", () => {
    deepEqual(getReferencesForFloatType(FloatType(), 1.0), [])
    deepEqual(getReferencesForFloatType(FloatType(), -1.0), [])
  })
})

describe("formatFloatValue", () => {
  it("formats a float value", () => {
    equal(formatFloatValue(FloatType(), 1.0), 1.0)
  })
})
