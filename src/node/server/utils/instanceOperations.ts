import type { InstanceContainer } from "../../../shared/utils/instances.ts"
import type { TSONDB } from "../../index.ts"
import {
  getChildInstances,
  saveInstanceTree,
  type CreatedEntityTaggedInstanceContainerWithChildInstances,
  type UpdatedEntityTaggedInstanceContainerWithChildInstances,
} from "../../utils/childInstances.ts"
import { HTTPError } from "../../utils/error.ts"

export const createInstance = async (
  db: TSONDB,
  instance: CreatedEntityTaggedInstanceContainerWithChildInstances,
  idQueryParam: string | undefined,
): Promise<InstanceContainer> => {
  const getEntity = db.schema.getEntity.bind(db.schema)
  const entity = getEntity(instance.entityName)

  if (entity === undefined) {
    throw new HTTPError(400, "Entity not found")
  }

  return await db.runTransaction(txn =>
    saveInstanceTree(
      txn,
      getEntity,
      undefined,
      undefined,
      instance.entityName,
      undefined,
      instance,
      idQueryParam,
    ),
  )
}

export const updateInstance = async (
  db: TSONDB,
  instance: UpdatedEntityTaggedInstanceContainerWithChildInstances,
): Promise<InstanceContainer> => {
  const getEntity = db.schema.getEntity.bind(db.schema)
  const instanceContent = db.getInstanceOfEntityById(instance.entityName, instance.id)

  if (instanceContent === undefined) {
    throw new HTTPError(400, "Instance not found")
  }

  const entity = getEntity(instance.entityName)

  if (entity === undefined) {
    throw new HTTPError(400, "Entity not found")
  }

  const oldChildInstances = getChildInstances(db, entity, instance.id, true)

  return db.runTransaction(txn =>
    saveInstanceTree(
      txn,
      getEntity,
      undefined,
      undefined,
      instance.entityName,
      {
        id: instance.id,
        content: instanceContent,
        childInstances: oldChildInstances,
        entityName: instance.entityName,
      },
      instance,
      undefined,
    ),
  )
}

export const deleteInstance = async (
  db: TSONDB,
  entityName: string,
  instanceId: string,
): Promise<InstanceContainer> => {
  const getEntity = db.schema.getEntity.bind(db.schema)
  const instanceContent = db.getInstanceOfEntityById(entityName, instanceId)

  if (instanceContent === undefined) {
    throw new HTTPError(400, "Instance not found")
  }

  const entity = getEntity(entityName)

  if (entity === undefined) {
    throw new HTTPError(400, "Entity not found")
  }

  const oldChildInstances = getChildInstances(db, entity, instanceId, true)

  return db.runTransaction(txn =>
    saveInstanceTree(
      txn,
      getEntity,
      undefined,
      undefined,
      entityName,
      {
        id: instanceId,
        content: instanceContent,
        childInstances: oldChildInstances,
        entityName,
      },
      undefined,
      undefined,
    ),
  )
}
