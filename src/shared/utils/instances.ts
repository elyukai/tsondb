import type { SerializedEntityDecl } from "../../node/schema/index.ts"
import { getDisplayNameFromEntityInstance } from "./displayName.ts"
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
  entity: SerializedEntityDecl,
  instanceContainer: InstanceContainer,
  locales?: string[],
): InstanceContainerOverview => {
  const { content: _, ...rest } = instanceContainer
  return {
    ...rest,
    displayName: getDisplayNameFromEntityInstance(
      entity,
      instanceContainer.content,
      instanceContainer.id,
      locales,
    ),
  }
}

export type InstancesByEntityName = Record<string, InstanceContainer[]>
