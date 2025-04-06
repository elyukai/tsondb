import { equal } from "assert"
import { describe, it } from "node:test"
import { render } from "../../../src/renderers/ts/render.js"
import {
  Array,
  Boolean,
  Float,
  Integer,
  isObjectType,
  Object,
  Optional,
  Required,
  Type,
  TypeAlias,
} from "../../../src/schema/index.js"
import { String } from "../../../src/schema/types/primitives/StringType.js"

describe("render types", () => {
  const testType = (type: Type, expected: string) =>
    equal(
      render(undefined, [TypeAlias("", { name: "Test", type: () => type })]),
      `export ${isObjectType(type) ? "interface" : "type"} Test${
        isObjectType(type) ? "" : " ="
      } ${expected}`,
    )

  describe("render primitives", () => {
    it("should render a BooleanType", () => {
      testType(Boolean(), "boolean")
    })

    it("should render a FloatType", () => {
      testType(Float(), "number")
    })

    it("should render an IntegerType", () => {
      testType(Integer(), "number")
    })

    it("should render a StringType", () => {
      testType(String(), "string")
    })
  })

  describe("render generic types", () => {
    it("should render an ArrayType", () => {
      testType(Array(String()), "string[]")
    })

    it("should render an ObjectType", () => {
      testType(
        Object({
          id: Required({ type: Integer() }),
          name: Optional({ type: String() }),
        }),
        `{
  id: number
  name?: string
}`,
      )
    })

    it("should render an ObjectType with comments", () => {
      testType(
        Object({
          id: Required({ comment: "The identifier.", type: Integer() }),
          name: Optional({ type: String() }),
        }),
        `{
  /**
   * The identifier.
   */
  id: number

  name?: string
}`,
      )
    })
  })
})
