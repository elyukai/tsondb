import { sortBySortOrder, type SortableInstance } from "../../shared/schema/utils/sortOrder.ts"
import {
  getSerializedDisplayNameFromEntityInstance,
  type DisplayNameResult,
} from "../../shared/utils/displayName.ts"
import type {
  InstanceContainer,
  InstanceContainerOverview,
  InstanceContent,
} from "../../shared/utils/instances.ts"
import type { EntityDecl } from "../schema/dsl/declarations/EntityDecl.ts"
import {
  normalizedIdArgs,
  type AnyChildEntityMap,
  type AnyEntityMap,
  type GetAllChildInstanceContainersForParent,
  type GetDisplayNameWithLocaleId,
  type GetEntityByName,
  type GetInstanceById,
  type GetInstanceContainerById,
  type IdArgsVariant,
  type RegisteredChildEntityMap,
  type RegisteredEntity,
  type RegisteredEntityMap,
} from "../schema/generatedTypeHelpers.js"
import { serializeNode } from "../schema/treeOperations/serialization.ts"
import {
  getGroupedInstancesFromDatabaseInMemory,
  type DatabaseInMemory,
} from "./databaseInMemory.ts"

export type GetChildInstancesForInstanceId = (
  parentEntityName: string,
  parentId: string,
  childEntityName: string,
) => { id: string; content: InstanceContent }[]

export type DisplayNameCustomizer<
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
> = (params: {
  instance: unknown
  instanceId: string
  instanceDisplayName: string
  instanceDisplayNameLocaleId: string | undefined
  locales: string[]
  getInstanceById: GetInstanceById<EM>
  getDisplayNameForInstanceId: GetDisplayNameWithLocaleId<EM>
  getAllChildInstancesForParent: GetAllChildInstanceContainersForParent<CEM>
}) => DisplayNameResult

export type TypedDisplayNameCustomizer<
  Name extends string,
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
> = (params: {
  instance: RegisteredEntity<Name>
  instanceId: string
  instanceDisplayName: string
  instanceDisplayNameLocaleId: string | undefined
  locales: string[]
  getInstanceById: GetInstanceById<EM>
  getDisplayNameForInstanceId: GetDisplayNameWithLocaleId<EM>
  getAllChildInstancesForParent: GetAllChildInstanceContainersForParent<CEM>
}) => DisplayNameResult

export const getDisplayNameFromEntityInstance = <
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
>(
  entity: EntityDecl,
  instanceContainer: InstanceContainer,
  getEntityByName: GetEntityByName<EM>,
  getInstanceById: GetInstanceContainerById<EM>,
  getAllChildInstancesForParent: GetAllChildInstanceContainersForParent<CEM>,
  locales: string[],
  defaultName: string = "",
  useCustomizer = true,
): DisplayNameResult => {
  const instanceDisplayNameCustomizer = entity.instanceDisplayNameCustomizer as
    | TypedDisplayNameCustomizer<string, EM, CEM>
    | undefined

  if (useCustomizer && instanceDisplayNameCustomizer) {
    const calculatedName = getDisplayNameFromEntityInstance(
      entity,
      instanceContainer,
      getEntityByName,
      getInstanceById,
      getAllChildInstancesForParent,
      locales,
      defaultName,
      false,
    )

    return instanceDisplayNameCustomizer({
      instance: instanceContainer.content,
      instanceId: instanceContainer.id,
      instanceDisplayName: calculatedName.name,
      instanceDisplayNameLocaleId: calculatedName.localeId,
      locales,
      getInstanceById: (...args) => getInstanceById(...args)?.content,
      getDisplayNameForInstanceId: (...args) => {
        const instance = getInstanceById(...args)
        const { entityName } = normalizedIdArgs(args)
        const entity = getEntityByName(entityName)
        if (instance && entity) {
          return getDisplayNameFromEntityInstance(
            entity,
            instance,
            getEntityByName,
            getInstanceById,
            getAllChildInstancesForParent,
            locales,
            instance.id,
          )
        } else {
          return undefined
        }
      },
      getAllChildInstancesForParent,
    })
  } else {
    return getSerializedDisplayNameFromEntityInstance(
      serializeNode(entity),
      instanceContainer.content,
      defaultName,
      locales,
    )
  }
}

export const getInstanceOverview = <
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
>(
  getInstanceById: GetInstanceContainerById<EM>,
  getAllChildInstancesForParent: GetAllChildInstanceContainersForParent<CEM>,
  getEntityByName: GetEntityByName<EM>,
  locales: string[],
  id: IdArgsVariant<EM>,
): InstanceContainerOverview | undefined => {
  const { entityName } = normalizedIdArgs(id)
  const instance = getInstanceById(...id)
  const entity = getEntityByName(entityName)

  if (!entity || !instance) {
    return undefined
  }

  const { name, localeId } = getDisplayNameFromEntityInstance(
    entity,
    instance,
    getEntityByName,
    getInstanceById,
    getAllChildInstancesForParent,
    locales,
  )

  return {
    id: instance.id,
    displayName: name,
    displayNameLocaleId: localeId,
    gitStatus: instance.gitStatus,
  }
}

export const getInstanceOverviewsByEntityName = <
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
>(
  getInstanceById: GetInstanceContainerById<EM>,
  getAllChildInstancesForParent: GetAllChildInstanceContainersForParent<CEM>,
  getEntityByName: GetEntityByName<EM>,
  entity: EntityDecl,
  instances: InstanceContainer[],
  locales: string[],
): InstanceContainerOverview[] => {
  return sortBySortOrder(
    instances.map((instance): SortableInstance => {
      const { name, localeId } = getDisplayNameFromEntityInstance(
        entity,
        instance,
        getEntityByName,
        getInstanceById,
        getAllChildInstancesForParent,
        locales,
      )

      return [
        instance,
        {
          id: instance.id,
          displayName: name,
          displayNameLocaleId: localeId,
          gitStatus: instance.gitStatus,
        },
      ]
    }),
    entity.sortOrder,
  ).map(arr => arr[1])
}

export const getAllInstanceOverviewsByEntityName = <
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
>(
  getInstanceById: GetInstanceContainerById<EM>,
  getAllChildInstancesForParent: GetAllChildInstanceContainersForParent<CEM>,
  getEntityByName: GetEntityByName<EM>,
  databaseInMemory: DatabaseInMemory<EM>,
  locales: string[],
): Record<string, InstanceContainerOverview[]> => {
  return Object.fromEntries(
    getGroupedInstancesFromDatabaseInMemory(databaseInMemory).map(([entityName, instances]) => {
      const entity = getEntityByName(entityName)
      return [
        entityName,
        getInstanceOverviewsByEntityName(
          getInstanceById,
          getAllChildInstancesForParent,
          getEntityByName,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          entity!,
          instances,
          locales,
        ),
      ]
    }),
  )
}
