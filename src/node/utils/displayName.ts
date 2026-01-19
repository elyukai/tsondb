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
import { serializeEntityDecl, type EntityDecl } from "../schema/declarations/EntityDecl.ts"
import type { RegisteredEntity } from "../schema/externalTypes.ts"
import { createChildInstancesForInstanceIdGetter } from "../server/utils/childInstances.ts"
import {
  createInstanceFromDatabaseInMemoryGetter,
  getGroupedInstancesFromDatabaseInMemory,
  type DatabaseInMemory,
  type InstanceFromDatabaseInMemoryGetter,
} from "./databaseInMemory.ts"

export type GetChildInstancesForInstanceId = (
  parentEntityName: string,
  parentId: string,
  childEntityName: string,
) => { id: string; content: InstanceContent }[]

export type DisplayNameCustomizer = (params: {
  instance: unknown
  instanceId: string
  instanceDisplayName: string
  instanceDisplayNameLocaleId: string | undefined
  locales: string[]
  getInstanceById: (id: string) => InstanceContent | undefined
  getDisplayNameForInstanceId: (id: string) => DisplayNameResult | undefined
  getChildInstancesForInstanceId: GetChildInstancesForInstanceId
}) => DisplayNameResult

export type TypedDisplayNameCustomizer<Name extends string> = (params: {
  instance: RegisteredEntity<Name>
  instanceId: string
  instanceDisplayName: string
  instanceDisplayNameLocaleId: string | undefined
  locales: string[]
  getInstanceById: (id: string) => InstanceContent | undefined
  getDisplayNameForInstanceId: (id: string) => DisplayNameResult | undefined
  getChildInstancesForInstanceId: GetChildInstancesForInstanceId
}) => DisplayNameResult

export const getDisplayNameFromEntityInstance = (
  entity: EntityDecl,
  instanceContainer: InstanceContainer,
  getInstanceById: InstanceFromDatabaseInMemoryGetter,
  getChildInstancesForInstanceId: GetChildInstancesForInstanceId,
  locales: string[],
  defaultName: string = "",
  useCustomizer = true,
): DisplayNameResult => {
  if (useCustomizer && entity.instanceDisplayNameCustomizer) {
    const calculatedName = getDisplayNameFromEntityInstance(
      entity,
      instanceContainer,
      getInstanceById,
      getChildInstancesForInstanceId,
      locales,
      defaultName,
      false,
    )

    return entity.instanceDisplayNameCustomizer({
      instance: instanceContainer.content,
      instanceId: instanceContainer.id,
      instanceDisplayName: calculatedName.name,
      instanceDisplayNameLocaleId: calculatedName.localeId,
      locales,
      getInstanceById: id => getInstanceById(id)?.instance.content,
      getDisplayNameForInstanceId: id => {
        const result = getInstanceById(id)
        if (result) {
          const { entity, instance } = result
          return getDisplayNameFromEntityInstance(
            entity,
            instance,
            getInstanceById,
            getChildInstancesForInstanceId,
            locales,
            id,
          )
        } else {
          return undefined
        }
      },
      getChildInstancesForInstanceId,
    })
  } else {
    return getSerializedDisplayNameFromEntityInstance(
      serializeEntityDecl(entity),
      instanceContainer.content,
      defaultName,
      locales,
    )
  }
}

export const getAllInstanceOverviewsByEntityName = (
  entitiesByName: Record<string, EntityDecl>,
  databaseInMemory: DatabaseInMemory,
  locales: string[],
): Record<string, InstanceContainerOverview[]> => {
  const getInstanceById = createInstanceFromDatabaseInMemoryGetter(databaseInMemory, entitiesByName)
  const getChildInstancesForInstanceId = createChildInstancesForInstanceIdGetter(
    entitiesByName,
    databaseInMemory,
  )

  return Object.fromEntries(
    getGroupedInstancesFromDatabaseInMemory(databaseInMemory).map(([entityName, instances]) => {
      const entity = entitiesByName[entityName]
      return [
        entityName,
        sortBySortOrder(
          instances.map((instance): SortableInstance => {
            const { name, localeId } = getDisplayNameFromEntityInstance(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              entitiesByName[entityName]!,
              instance,
              getInstanceById,
              getChildInstancesForInstanceId,
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
          entity?.sortOrder,
        ).map(arr => arr[1]),
      ]
    }),
  )
}
