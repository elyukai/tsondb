import { deepEqual, equal, notEqual } from "assert/strict"
import { describe, it } from "node:test"
import {
  BooleanType,
  formatBooleanValue,
  getReferencesForBooleanType,
  isBooleanType,
  NodeKind,
  serializeBooleanType,
  StringType,
  validateBooleanType,
} from "../../../../../src/node/schema/index.ts"
import { json } from "../../../../../src/node/utils/errorFormatting.ts"

describe("constructor", () => {
  it("should create a new Boolean type", () => {
    deepEqual(BooleanType(), { kind: NodeKind.BooleanType })
  })

  it("should always create a new object", () => {
    notEqual(BooleanType(), BooleanType())
  })
})

describe("predicate", () => {
  it("returns if the node is a BooleanType", () => {
    equal(isBooleanType(BooleanType()), true)
    equal(isBooleanType(StringType()), false)
  })
})

describe("validateBooleanType", () => {
  it("returns if the value is a valid BooleanType", () => {
    deepEqual(
      validateBooleanType({ checkReferentialIntegrity: () => [] }, BooleanType(), false),
      [],
    )
    deepEqual(validateBooleanType({ checkReferentialIntegrity: () => [] }, BooleanType(), "true"), [
      TypeError(`expected a boolean value, but got ${json("true")}`),
    ])
  })
})

describe("serializeBooleanType", () => {
  it("returns a serializable BooleanType", () => {
    deepEqual(
      serializeBooleanType({
        parent: StringType(),
        kind: NodeKind.BooleanType,
      }),
      {
        kind: NodeKind.BooleanType,
      },
    )
  })
})

describe("getReferencesForBooleanType", () => {
  it("returns the references in the value", () => {
    deepEqual(getReferencesForBooleanType(BooleanType(), false), [])
    deepEqual(getReferencesForBooleanType(BooleanType(), true), [])
  })
})

describe("formatBooleanValue", () => {
  it("formats a boolean value", () => {
    equal(formatBooleanValue(BooleanType(), false), false)
  })
})
