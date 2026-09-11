import { isError, ok } from "@elyukai/utils/result"
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import * as DSL from "../../../src/node/schema/dsl/index.ts"
import {
  checkUniqueConstraintsForEntity,
  UniqueConstraintError,
} from "../../../src/node/utils/unique.ts"
import type {
  InstanceContainer,
  InstanceContainerOverview,
} from "../../../src/shared/utils/instances.ts"

describe("checkUniqueConstraintsForEntity", () => {
  describe("simple key path", () => {
    const entity = DSL.Entity(import.meta.url, {
      name: "TestEntity",
      namePlural: "TestEntities",
      type: () =>
        DSL.Object({
          name: DSL.Required({ type: DSL.String() }),
        }),
      uniqueConstraints: [{ keyPath: ["name"] }],
    })

    it("should pass when no unique constraints are violated", () => {
      const instances: InstanceContainer[] = [
        { id: "1", content: { name: "Alice" } },
        { id: "2", content: { name: "Bob" } },
        { id: "3", content: { name: "Charlie" } },
      ]

      const instanceOverviews: InstanceContainerOverview[] = [
        { id: "1", displayName: "Alice" },
        { id: "2", displayName: "Bob" },
        { id: "3", displayName: "Charlie" },
      ]

      assert.deepEqual(checkUniqueConstraintsForEntity(entity, instances, instanceOverviews), ok())
    })

    it("should return an error when unique constraints are violated", () => {
      const instances: InstanceContainer[] = [
        { id: "1", content: { name: "Alice" } },
        { id: "2", content: { name: "Bob" } },
        { id: "3", content: { name: "Bob" } },
      ]

      const instanceOverviews: InstanceContainerOverview[] = [
        { id: "1", displayName: "Alice" },
        { id: "2", displayName: "Bob" },
        { id: "3", displayName: "Bob" },
      ]

      const res = checkUniqueConstraintsForEntity(entity, instances, instanceOverviews)
      assert.ok(isError(res))
      const err = res.error
      assert.ok(err instanceof AggregateError)
      assert.equal(err.message, `in entity "${entity.name}"`)
      assert.ok(err.errors.every(e => e instanceof UniqueConstraintError))
      assert.deepEqual(
        err.errors.map(e => [e.message, e.parts]),
        [[`for unique constraint name:`, [`"Bob" (2)`, `"Bob" (3)`]]],
      )
    })
  })

  describe("keypath with fallback", () => {
    const entity = DSL.Entity(import.meta.url, {
      name: "TestEntity",
      namePlural: "TestEntities",
      type: () =>
        DSL.Object({
          name: DSL.Required({ type: DSL.String() }),
          otherName: DSL.Optional({ type: DSL.String() }),
        }),
      uniqueConstraints: [{ keyPath: ["name"], keyPathFallback: ["otherName"] }],
    })

    it("should pass when no unique constraints are violated", () => {
      const instances: InstanceContainer[] = [
        { id: "1", content: { name: "Alice" } },
        { id: "2", content: { name: "Bob" } },
        { id: "3", content: { name: "Charlie" } },
      ]

      const instanceOverviews: InstanceContainerOverview[] = [
        { id: "1", displayName: "Alice" },
        { id: "2", displayName: "Bob" },
        { id: "3", displayName: "Charlie" },
      ]

      assert.deepEqual(checkUniqueConstraintsForEntity(entity, instances, instanceOverviews), ok())
    })

    it("should return an error when unique constraints are violated", () => {
      const instances: InstanceContainer[] = [
        { id: "1", content: { name: "Alice" } },
        { id: "2", content: { name: "Bob" } },
        { id: "3", content: { name: "Bob" } },
      ]

      const instanceOverviews: InstanceContainerOverview[] = [
        { id: "1", displayName: "Alice" },
        { id: "2", displayName: "Bob" },
        { id: "3", displayName: "Bob" },
      ]

      const res = checkUniqueConstraintsForEntity(entity, instances, instanceOverviews)
      assert.ok(isError(res))
      const err = res.error
      assert.ok(err instanceof AggregateError)
      assert.equal(err.message, `in entity "${entity.name}"`)
      assert.ok(err.errors.every(e => e instanceof UniqueConstraintError))
      assert.deepEqual(
        err.errors.map(e => [e.message, e.parts]),
        [[`for unique constraint name|otherName:`, [`"Bob" (2)`, `"Bob" (3)`]]],
      )
    })
  })
})
