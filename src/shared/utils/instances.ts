import type { EntityDecl } from "../../node/schema/index.ts"
import type { InstanceFromDatabaseInMemoryGetter } from "../../node/utils/databaseInMemory.ts"
import {
  getDisplayNameFromEntityInstance,
  type GetChildInstancesForInstanceId,
} from "../../node/utils/displayName.ts"
import type { GitFileStatus } from "./git.ts"

export type InstanceContent = object

export interface InstanceContainer {
  id: string
  content: InstanceContent
  gitStatus?: GitFileStatus
}

export interface InstanceContainerOverview {
  id: string
  gitStatus?: GitFileStatus
  displayName: string
  displayNameLocaleId?: string
}

export const getInstanceContainerOverview = (
  entity: EntityDecl,
  instanceContainer: InstanceContainer,
  getInstanceById: InstanceFromDatabaseInMemoryGetter,
  getChildInstancesForInstanceId: GetChildInstancesForInstanceId,
  locales: string[],
): InstanceContainerOverview => {
  const { content: _, ...rest } = instanceContainer
  const { name: displayName, localeId: displayNameLocaleId } = getDisplayNameFromEntityInstance(
    entity,
    instanceContainer,
    getInstanceById,
    getChildInstancesForInstanceId,
    locales,
  )

  return {
    ...rest,
    displayName,
    displayNameLocaleId,
  }
}
