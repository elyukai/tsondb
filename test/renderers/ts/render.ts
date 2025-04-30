import { equal } from "assert"
import { describe, it } from "node:test"
import { render } from "../../../src/renderers/ts/render.js"
import {
  Array,
  Boolean,
  Float,
  GenericArgumentIdentifierType,
  GenIncludeIdentifierType,
  GenTypeAliasDecl,
  Integer,
  isObjectType,
  Object,
  Optional,
  Param,
  Required,
  Type,
  TypeAliasDecl,
} from "../../../src/schema/index.js"
import { String } from "../../../src/schema/types/primitives/StringType.js"

describe("render types", () => {
  const testType = (type: Type, expected: string) =>
    equal(
      render(undefined, [TypeAliasDecl("", { name: "Test", type: () => type })]),
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

describe("render declarations", () => {
  it("should render generic type aliases", () => {
    const A = GenTypeAliasDecl(import.meta.url, {
      name: "A",
      parameters: [Param("T")],
      type: t => Array(GenericArgumentIdentifierType(t)),
    })

    const B = TypeAliasDecl(import.meta.url, {
      name: "B",
      type: () => GenIncludeIdentifierType(A, [String()]),
    })

    equal(
      render(undefined, [A, B]),
      `export type A<T> = T[]

export type B = A<string>`,
    )
  })
})
