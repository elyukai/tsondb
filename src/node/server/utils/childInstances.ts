import { isEntityDeclWithParentReference, type EntityDecl } from "../../schema/index.ts"
import { getChildInstancesFromEntity } from "../../utils/childInstances.ts"
import type { DatabaseInMemory } from "../../utils/databaseInMemory.ts"
import type { GetChildInstancesForInstanceId } from "../../utils/displayName.ts"

export const createChildInstancesForInstanceIdGetter =
  (
    entitiesByName: Record<string, EntityDecl>,
    databaseInMemory: DatabaseInMemory,
  ): GetChildInstancesForInstanceId =>
  (parentEntityName, parentId, childEntityName) => {
    const parentEntity = entitiesByName[parentEntityName]
    const childEntity = entitiesByName[childEntityName]

    if (
      parentEntity === undefined ||
      childEntity === undefined ||
      !isEntityDeclWithParentReference(childEntity)
    ) {
      return []
    }

    return getChildInstancesFromEntity(databaseInMemory, parentEntity, parentId, childEntity)
  }
