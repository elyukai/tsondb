import { deepEqual } from "node:assert/strict"
import { describe, it } from "node:test"
import { render } from "../../../src/renderers/jsonschema/render.js"
import { GenTypeAliasDecl, TypeAliasDecl } from "../../../src/schema/declarations/TypeAliasDecl.js"
import { resolveTypeArgumentsInDecls } from "../../../src/schema/index.js"
import { Param } from "../../../src/schema/TypeParameter.js"
import { Array } from "../../../src/schema/types/generic/ArrayType.js"
import { String } from "../../../src/schema/types/primitives/StringType.js"
import { GenIncludeIdentifierType } from "../../../src/schema/types/references/IncludeIdentifierType.js"
import { TypeArgumentType } from "../../../src/schema/types/references/TypeArgumentType.js"

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

    deepEqual(JSON.parse(render(undefined, resolveTypeArgumentsInDecls([A, B]))), {
      $defs: {
        B: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    })
  })
})
