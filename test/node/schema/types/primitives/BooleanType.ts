import { deepEqual, equal, notEqual } from "assert/strict"
import { describe, it } from "node:test"
import { BooleanType, StringType, TypeAliasDecl } from "../../../../../src/node/schema/dsl/index.ts"
import { isBooleanType } from "../../../../../src/node/schema/guards.ts"
import { formatValue } from "../../../../../src/node/schema/treeOperations/format.ts"
import { getReferences } from "../../../../../src/node/schema/treeOperations/references.ts"
import { serializeNode } from "../../../../../src/node/schema/treeOperations/serialization.ts"
import { validateType } from "../../../../../src/node/schema/treeOperations/validation.ts"
import { json } from "../../../../../src/node/utils/errorFormatting.ts"
import { NodeKind } from "../../../../../src/shared/schema/Node.ts"

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
      validateType(
        { checkReferentialIntegrity: () => [], useStyling: true },
        [],
        BooleanType(),
        false,
      ),
      [],
    )
    deepEqual(
      validateType(
        { checkReferentialIntegrity: () => [], useStyling: true },
        [],
        BooleanType(),
        "true",
      ),
      [TypeError(`expected a boolean value, but got ${json("true", true)}`)],
    )
  })
})

describe("serializeBooleanType", () => {
  it("returns a serializable BooleanType", () => {
    deepEqual(
      serializeNode({
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
    const type = BooleanType()
    const inDecl = [TypeAliasDecl(import.meta.url, { name: "Decl", type: () => type })]
    deepEqual(getReferences(BooleanType(), false, inDecl), [])
    deepEqual(getReferences(BooleanType(), true, inDecl), [])
  })
})

describe("formatBooleanValue", () => {
  it("formats a boolean value", () => {
    equal(formatValue(BooleanType(), false), false)
  })
})
