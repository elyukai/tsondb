import assert from "assert"
import { it } from "node:test"
import {
  EntityDecl,
  NestedEntityMapType,
  ObjectType,
  Required,
  StringType,
} from "../../../src/node/schema/dsl/index.ts"
import { Schema } from "../../../src/node/schema/index.ts"

it("collects multiple nested entity declarations for a schema", () => {
  const SecondaryDecl = EntityDecl("there", {
    name: "B",
    namePlural: "Bs",
    type: () =>
      ObjectType({
        name: Required({ type: StringType() }),
      }),
  })

  const TertiaryDecl = EntityDecl("there", {
    name: "C",
    namePlural: "Cs",
    type: () =>
      ObjectType({
        name: Required({ type: StringType() }),
      }),
  })

  const Decl = EntityDecl("here", {
    name: "A",
    namePlural: "As",
    type: () =>
      ObjectType({
        name: Required({ type: StringType() }),
        translations: Required({
          type: NestedEntityMapType({
            name: "AA",
            namePlural: "AAs",
            secondaryEntity: SecondaryDecl,
            type: ObjectType({
              nestedTranslations: Required({
                type: NestedEntityMapType({
                  name: "AB",
                  namePlural: "ABs",
                  secondaryEntity: TertiaryDecl,
                  type: ObjectType({
                    name: Required({ type: StringType() }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
  })

  const schema = new Schema([Decl])

  const expectedEntityNames = ["A", "AA", "AB", "B", "C"].toSorted()
  const collectedEntityNames = schema.declarations.map(entity => entity.name).toSorted()
  assert.deepEqual(collectedEntityNames, expectedEntityNames)
})
