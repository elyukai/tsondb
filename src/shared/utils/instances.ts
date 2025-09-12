import type { EntityDecl } from "../../node/schema/index.ts"
import type { GetInstanceById } from "../../node/server/index.ts"
import { getDisplayNameFromEntityInstance } from "../../node/utils/displayName.ts"
import type { GitFileStatus } from "./git.ts"

export interface InstanceContainer {
  fileName: string
  id: string
  content: unknown
  gitStatus?: GitFileStatus
}

export interface InstanceContainerOverview {
  fileName: string
  id: string
  gitStatus?: GitFileStatus
  displayName: string
}

export const getInstanceContainerOverview = (
  entity: EntityDecl,
  instanceContainer: InstanceContainer,
  getInstanceById: GetInstanceById,
  locales?: string[],
): InstanceContainerOverview => {
  const { content: _, ...rest } = instanceContainer
  return {
    ...rest,
    displayName: getDisplayNameFromEntityInstance(
      entity,
      instanceContainer.content,
      getInstanceById,
      locales,
    ),
  }
}

export type InstancesByEntityName = Record<string, InstanceContainer[]>
