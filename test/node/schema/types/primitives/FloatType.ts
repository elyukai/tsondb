import { deepEqual, equal, notEqual } from "assert/strict"
import { describe, it } from "node:test"
import { FloatType, StringType, TypeAliasDecl } from "../../../../../src/node/schema/dsl/index.ts"
import { isFloatType } from "../../../../../src/node/schema/guards.ts"
import { formatValue } from "../../../../../src/node/schema/treeOperations/format.ts"
import { getReferences } from "../../../../../src/node/schema/treeOperations/references.ts"
import { serializeNode } from "../../../../../src/node/schema/treeOperations/serialization.ts"
import {
  validateTypeStructuralIntegrity,
  type ValidationContext,
} from "../../../../../src/node/schema/treeOperations/validation.ts"
import { json } from "../../../../../src/node/utils/errorFormatting.ts"
import { NodeKind } from "../../../../../src/shared/schema/Node.ts"

const validationContext: ValidationContext = {
  useStyling: true,
  validationOptions: { checkReferentialIntegrity: false, checkOnlyEntities: [] },
}

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
    deepEqual(validateTypeStructuralIntegrity(validationContext, [], FloatType(), 1.0), [])
    deepEqual(validateTypeStructuralIntegrity(validationContext, [], FloatType(), "true"), [
      TypeError(`expected a floating-point number, but got ${json("true", true)}`),
    ])
  })
})

describe("serializeFloatType", () => {
  it("returns a serializable FloatType", () => {
    deepEqual(
      serializeNode({
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
    const type = FloatType()
    const inDecl = [TypeAliasDecl(import.meta.url, { name: "Decl", type: () => type })]
    deepEqual(getReferences(type, 1.0, inDecl), [])
    deepEqual(getReferences(type, -1.0, inDecl), [])
  })
})

describe("formatFloatValue", () => {
  it("formats a float value", () => {
    equal(formatValue(FloatType(), 1.0), 1.0)
  })
})
