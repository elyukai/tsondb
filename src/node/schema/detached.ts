/**
 * Standalone functions for database operations without needing a full TSONDB instance.
 */

import { type DatabaseInMemory } from "../utils/databaseInMemory.ts"
import { getDisplayNameFromEntityInstance } from "../utils/displayName.ts"
import {
  normalizedIdArgs,
  type AnyEntityMap,
  type GetEntityByName,
  type IdArgsVariant,
} from "./generatedTypeHelpers.ts"

export const getDisplayName = <EM extends AnyEntityMap>(
  getEntity: GetEntityByName<EM>,
  locales: string[],
  data: DatabaseInMemory<EM>,
  ...args: IdArgsVariant<EM>
): string | undefined => {
  const { entityName, id } = normalizedIdArgs(args)
  // return instanceOverviewsByEntityName[entityName]?.find(o => o.id === id)?.displayName
  const entity = getEntity(entityName)
  if (!entity) {
    return undefined
  }
  const instance = data.getInstanceContainerOfEntityById(entity.name, id)
  if (!instance) {
    return undefined
  }
  return getDisplayNameFromEntityInstance(
    entity,
    instance,
    getEntity,
    data.getInstanceContainerOfEntityById.bind(data),
    data.getAllChildInstanceContainersForParent.bind(data, getEntity),
    locales,
  ).name
}

export const getDisplayNameWithId = <EM extends AnyEntityMap>(
  getEntity: GetEntityByName<EM>,
  locales: string[],
  data: DatabaseInMemory<EM>,
  ...args: IdArgsVariant<EM>
): string => {
  const { id } = normalizedIdArgs(args)
  const displayName = getDisplayName(getEntity, locales, data, ...args)
  return displayName ? `"${displayName}" (${id})` : id
}
