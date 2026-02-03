import type { EntityDecl } from "../../node/schema/dsl/index.ts"
import type {
  AnyChildEntityMap,
  AnyEntityMap,
  GetAllChildInstanceContainersForParent,
  GetEntityByName,
  GetInstanceContainerById,
} from "../../node/schema/generatedTypeHelpers.ts"
import { getDisplayNameFromEntityInstance } from "../../node/utils/displayName.ts"
import type { GitFileStatus } from "./git.ts"

export type InstanceContent = object

export interface InstanceContainer<T = InstanceContent> {
  id: string
  content: T
  gitStatus?: GitFileStatus
}

export interface InstanceContainerOverview {
  id: string
  gitStatus?: GitFileStatus
  displayName: string
  displayNameLocaleId?: string
}

export const getInstanceContainerOverview = <
  EM extends AnyEntityMap,
  CEM extends AnyChildEntityMap,
>(
  entity: EntityDecl,
  instanceContainer: InstanceContainer,
  getEntityByName: GetEntityByName<EM>,
  getInstanceById: GetInstanceContainerById<EM>,
  getChildInstancesForInstanceId: GetAllChildInstanceContainersForParent<CEM>,
  locales: string[],
): InstanceContainerOverview => {
  const { content: _, ...rest } = instanceContainer
  const { name: displayName, localeId: displayNameLocaleId } = getDisplayNameFromEntityInstance(
    entity,
    instanceContainer,
    getEntityByName,
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
