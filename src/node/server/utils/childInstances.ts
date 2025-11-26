import { isEntityDeclWithParentReference } from "../../schema/index.ts"
import { getChildInstancesFromEntity } from "../../utils/childInstances.ts"
import type { GetChildInstancesForInstanceId } from "../../utils/displayName.ts"
import type { TSONDBRequestLocals } from "../index.ts"

export const createChildInstancesForInstanceIdGetter =
  (locals: TSONDBRequestLocals): GetChildInstancesForInstanceId =>
  (parentEntityName, parentId, childEntityName) => {
    const parentEntity = locals.entitiesByName[parentEntityName]
    const childEntity = locals.entitiesByName[childEntityName]

    if (
      parentEntity === undefined ||
      childEntity === undefined ||
      !isEntityDeclWithParentReference(childEntity)
    ) {
      return []
    }

    return getChildInstancesFromEntity(locals.databaseInMemory, parentEntity, parentId, childEntity)
  }
