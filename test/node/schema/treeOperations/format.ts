import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { ObjectType, Required, StringType } from "../../../../src/node/schema/dsl/index.ts"
import { formatValue } from "../../../../src/node/schema/treeOperations/format.ts"

describe("format", () => {
  it("formats an object based on the order of the provided keys", () => {
    const type = ObjectType({
      id: Required({ type: StringType() }),
      name: Required({ type: StringType() }),
      label: Required({ type: StringType() }),
    })

    const object = { label: "Label", id: "ID", name: "Name" }
    const expected = { id: "ID", name: "Name", label: "Label" }

    assert.equal(
      JSON.stringify(formatValue(type, object, {}, undefined)),
      JSON.stringify(expected),
      "The object should be formatted according to the type definition.",
    )
  })
})
