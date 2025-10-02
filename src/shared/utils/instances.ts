import type { EntityDecl } from "../../node/schema/index.ts"
import type { GetInstanceById } from "../../node/server/index.ts"
import {
  getDisplayNameFromEntityInstance,
  type GetChildInstancesForInstanceId,
} from "../../node/utils/displayName.ts"
import type { GitFileStatus } from "./git.ts"

export interface InstanceContainer {
  id: string
  content: unknown
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
  getInstanceById: GetInstanceById,
  getChildInstancesForInstanceId: GetChildInstancesForInstanceId,
  locales: string[],
): InstanceContainerOverview => {
  const { content: _, ...rest } = instanceContainer
  const { name: displayName, localeId: displayNameLocaleId } = getDisplayNameFromEntityInstance(
    entity,
    instanceContainer.content,
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

export type InstancesByEntityName = Record<string, InstanceContainer[]>
