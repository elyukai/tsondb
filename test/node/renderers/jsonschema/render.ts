import { deepEqual } from "node:assert/strict"
import { describe, it } from "node:test"
import { render } from "../../../../src/node/renderers/jsonschema/render.ts"
import {
  GenTypeAliasDecl,
  TypeAliasDecl,
} from "../../../../src/node/schema/declarations/TypeAliasDecl.ts"
import { resolveTypeArgumentsInDecls } from "../../../../src/node/schema/index.ts"
import { Param } from "../../../../src/node/schema/TypeParameter.ts"
import { Array } from "../../../../src/node/schema/types/generic/ArrayType.ts"
import { String } from "../../../../src/node/schema/types/primitives/StringType.ts"
import { GenIncludeIdentifierType } from "../../../../src/node/schema/types/references/IncludeIdentifierType.ts"
import { TypeArgumentType } from "../../../../src/node/schema/types/references/TypeArgumentType.ts"

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
