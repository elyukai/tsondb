import { equal } from "node:assert/strict"
import { describe, it } from "node:test"
import {
  EntityDecl,
  ObjectType,
  Required,
  serializeEntityDecl,
  StringType,
} from "../../../src/node/schema/index.js"
import { getDisplayNameFromEntityInstance } from "../../../src/shared/utils/displayName.js"

describe("getDisplayNameFromEntityInstance", () => {
  const entity = serializeEntityDecl(
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

  const translatableEntity = serializeEntityDecl(
    EntityDecl(import.meta.url, {
      name: "User",
      namePlural: "Users",
      type: () =>
        ObjectType({
          name: Required({
            type: StringType(),
          }),
        }),
      displayName: {},
    }),
  )

  it("returns the default name if the default display name path is empty", () => {
    equal(
      getDisplayNameFromEntityInstance(entity, {}, "Default Name", ["de-DE", "en-US"]),
      "Default Name",
    )
  })

  it("returns the value of the property if the default display name path is set", () => {
    equal(
      getDisplayNameFromEntityInstance(
        entity,
        {
          name: "John Doe",
        },
        "Default Name",
        ["de-DE", "en-US"],
      ),
      "John Doe",
    )
  })

  it("returns the default name if the default translatable display name path is empty", () => {
    equal(
      getDisplayNameFromEntityInstance(translatableEntity, {}, "Default Name", ["de-DE", "en-US"]),
      "Default Name",
    )
  })

  it("returns the default name if there are no available locales and the default translatable display name path is set", () => {
    equal(
      getDisplayNameFromEntityInstance(
        translatableEntity,
        { translations: { "de-DE": "Gast", "en-US": "Guest" } },
        "Default Name",
        [],
      ),
      "Default Name",
    )
  })

  it("returns the first name that is available in a specified locale in the order the locales are specified if the default translatable display name path is set", () => {
    equal(
      getDisplayNameFromEntityInstance(
        translatableEntity,
        { translations: { "de-DE": { name: "Gast" }, "en-US": { name: "Guest" } } },
        "Default Name",
        ["de-DE", "en-US"],
      ),
      "Gast",
    )
    equal(
      getDisplayNameFromEntityInstance(
        translatableEntity,
        { translations: { "en-US": { name: "Guest" } } },
        "Default Name",
        ["de-DE", "en-US"],
      ),
      "Guest",
    )
  })
})
