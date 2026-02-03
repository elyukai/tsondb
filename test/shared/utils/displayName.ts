import { deepEqual } from "node:assert/strict"
import { describe, it } from "node:test"
import { EntityDecl, ObjectType, Required, StringType } from "../../../src/node/schema/dsl/index.ts"
import { serializeNode } from "../../../src/node/schema/treeOperations/serialization.ts"
import {
  getSerializedDisplayNameFromEntityInstance,
  type DisplayNameResult,
} from "../../../src/shared/utils/displayName.ts"

describe("getDisplayNameFromEntityInstance", () => {
  const entity = serializeNode(
    EntityDecl(import.meta.url, {
      name: "User",
      namePlural: "Users",
      type: () =>
        ObjectType({
          name: Required({
            type: StringType(),
          }),
        }),
    }),
  )

  const translatableEntity = serializeNode(
    EntityDecl(import.meta.url, {
      name: "User",
      namePlural: "Users",
      type: () =>
        ObjectType({
          name: Required({
            type: StringType(),
          }),
        }),
      instanceDisplayName: {},
    }),
  )

  it("returns the default name if the default display name path is empty", () => {
    deepEqual<DisplayNameResult>(
      getSerializedDisplayNameFromEntityInstance(entity, {}, "Default Name", ["de-DE", "en-US"]),
      { name: "Default Name", localeId: "de-DE" },
    )
  })

  it("returns the value of the property if the default display name path is set", () => {
    deepEqual<DisplayNameResult>(
      getSerializedDisplayNameFromEntityInstance(
        entity,
        {
          name: "John Doe",
        },
        "Default Name",
        ["de-DE", "en-US"],
      ),
      { name: "John Doe", localeId: "de-DE" },
    )
  })

  it("returns the default name if the default translatable display name path is empty", () => {
    deepEqual<DisplayNameResult>(
      getSerializedDisplayNameFromEntityInstance(translatableEntity, {}, "Default Name", [
        "de-DE",
        "en-US",
      ]),
      { name: "Default Name" },
    )
  })

  it("returns the default name if there are no available locales and the default translatable display name path is set", () => {
    deepEqual<DisplayNameResult>(
      getSerializedDisplayNameFromEntityInstance(
        translatableEntity,
        { translations: { "de-DE": "Gast", "en-US": "Guest" } },
        "Default Name",
        [],
      ),
      { name: "Default Name" },
    )
  })

  it("returns the first name that is available in a specified locale in the order the locales are specified if the default translatable display name path is set", () => {
    deepEqual<DisplayNameResult>(
      getSerializedDisplayNameFromEntityInstance(
        translatableEntity,
        { translations: { "de-DE": { name: "Gast" }, "en-US": { name: "Guest" } } },
        "Default Name",
        ["de-DE", "en-US"],
      ),
      { name: "Gast", localeId: "de-DE" },
    )
    deepEqual<DisplayNameResult>(
      getSerializedDisplayNameFromEntityInstance(
        translatableEntity,
        { translations: { "en-US": { name: "Guest" } } },
        "Default Name",
        ["de-DE", "en-US"],
      ),
      { name: "Guest", localeId: "en-US" },
    )
  })
})
