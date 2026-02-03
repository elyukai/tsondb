import { equal } from "assert"
import { describe, it } from "node:test"
import { render } from "../../../../src/node/renderers/ts/render.ts"
import type { Type } from "../../../../src/node/schema/dsl/index.ts"
import {
  Array,
  Boolean,
  Float,
  GenIncludeIdentifierType,
  GenTypeAliasDecl,
  Integer,
  Object,
  Optional,
  Required,
  TypeAliasDecl,
  TypeArgumentType,
} from "../../../../src/node/schema/dsl/index.ts"
import { Param } from "../../../../src/node/schema/dsl/TypeParameter.ts"
import { String } from "../../../../src/node/schema/dsl/types/StringType.ts"
import { isObjectType } from "../../../../src/node/schema/guards.ts"

describe("render types", () => {
  const testType = (type: Type, expected: string) => {
    equal(
      render(undefined, [TypeAliasDecl("", { name: "Test", type: () => type })]),
      `export ${isObjectType(type) ? "interface" : "type"} Test${
        isObjectType(type) ? "" : " ="
      } ${expected}`,
    )
  }

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
      type: t => Array(TypeArgumentType(t)),
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
