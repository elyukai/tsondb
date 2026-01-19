import type { KeyPath } from "./keyPath.ts"

/**
 * A uniquing element can be the full value of a key or the value of a key in a nested entity map.
 */
export type UniquingElement =
  | { keyPath: KeyPath; keyPathFallback?: KeyPath }
  | { entityMapKeyPath: KeyPath; keyPathInEntityMap: KeyPath; keyPathInEntityMapFallback?: KeyPath }

export type UniqueConstraint = UniquingElement | UniquingElement[]

/**
 * A list of keys or key descriptions whose values need to be unique across all instances in the entity.
 *
 * One or more constraints may be provided. A nested array indicates that the combination of described values must be unique.
 *
 * @example
 *
 * ["name"] // all `name` keys must be unique across the entity
 * ["name", "age"] // all `name` keys and all `age` keys must be unique across the entity
 * [["name", "age"]] // the combination of `name` and `age` must be unique across the entity
 */
export type UniqueConstraints = UniqueConstraint[]
