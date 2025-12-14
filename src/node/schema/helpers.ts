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
