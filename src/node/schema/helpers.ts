import type { RegisteredChildEntityMap, RegisteredEntityMap } from "./externalTypes.ts"

export type GetInstanceById = <U extends keyof RegisteredEntityMap>(
  entity: U,
  id: string,
) => RegisteredEntityMap[U] | undefined

export type GetAllInstances = <U extends keyof RegisteredEntityMap>(
  entity: U,
) => RegisteredEntityMap[U][]

export type GetAllChildInstancesForParent = <U extends keyof RegisteredChildEntityMap>(
  entity: U,
  parentId: RegisteredChildEntityMap[U][2],
) => RegisteredChildEntityMap[U][0][]

/**
 * Displays the name of an entity instance including its ID. If no display name is found, `undefined` is returned.
 */
export type GetDisplayName = (entity: keyof RegisteredEntityMap, id: string) => string | undefined

/**
 * Displays the name of an entity instance including its ID. If no display name is found, only the ID is returned.
 */
export type GetDisplayNameWithId = (entity: keyof RegisteredEntityMap, id: string) => string
