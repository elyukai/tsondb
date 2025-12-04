import type { InstanceContainer } from "../../../shared/utils/instances.ts"
import { error, isError, ok, type Result } from "../../../shared/utils/result.ts"
import {
  getChildInstances,
  saveInstanceTree,
  type CreatedEntityTaggedInstanceContainerWithChildInstances,
  type UpdatedEntityTaggedInstanceContainerWithChildInstances,
} from "../../utils/childInstances.ts"
import { getInstanceOfEntityFromDatabaseInMemory } from "../../utils/databaseInMemory.ts"
import { runDatabaseTransaction } from "../../utils/databaseTransactions.ts"
import { HTTPError } from "../../utils/error.ts"
import type { TSONDBRequestLocals } from "../index.ts"

export const createInstance = async (
  locals: TSONDBRequestLocals,
  instance: CreatedEntityTaggedInstanceContainerWithChildInstances,
  idQueryParam: unknown,
): Promise<Result<InstanceContainer, Error>> => {
  const entity = locals.entitiesByName[instance.entityName]

  if (entity === undefined) {
    return error(new HTTPError(400, "Entity not found"))
  }

  const databaseTransactionResult = await runDatabaseTransaction(
    locals.dataRoot,
    locals.gitRoot ? locals.git : undefined,
    locals.entitiesByName,
    locals.databaseInMemory,
    locals.referencesToInstances,
    res =>
      saveInstanceTree(
        locals.validationOptions,
        locals.entitiesByName,
        undefined,
        undefined,
        locals.localeEntity,
        instance.entityName,
        undefined,
        instance,
        idQueryParam,
        res,
      ),
  )

  if (isError(databaseTransactionResult)) {
    return databaseTransactionResult
  }

  const {
    db: newDatabaseInMemory,
    refs: newReferencesToInstances,
    instanceContainer,
  } = databaseTransactionResult.value

  locals.setLocal("databaseInMemory", newDatabaseInMemory)
  locals.setLocal("referencesToInstances", newReferencesToInstances)

  return ok(instanceContainer)
}

export const updateInstance = async (
  locals: TSONDBRequestLocals,
  instance: UpdatedEntityTaggedInstanceContainerWithChildInstances,
): Promise<Result<InstanceContainer, Error>> => {
  const instanceContainer = getInstanceOfEntityFromDatabaseInMemory(
    locals.databaseInMemory,
    instance.entityName,
    instance.id,
  )

  if (instanceContainer === undefined) {
    return error(new HTTPError(400, "Instance not found"))
  }

  const entity = locals.entitiesByName[instance.entityName]

  if (entity === undefined) {
    return error(new HTTPError(400, "Entity not found"))
  }

  const oldChildInstances = getChildInstances(locals.databaseInMemory, entity, instance.id, true)

  const databaseTransactionResult = await runDatabaseTransaction(
    locals.dataRoot,
    locals.gitRoot ? locals.git : undefined,
    locals.entitiesByName,
    locals.databaseInMemory,
    locals.referencesToInstances,
    res =>
      saveInstanceTree(
        locals.validationOptions,
        locals.entitiesByName,
        undefined,
        undefined,
        locals.localeEntity,
        instance.entityName,
        {
          id: instance.id,
          content: instanceContainer.content,
          childInstances: oldChildInstances,
          entityName: instance.entityName,
        },
        instance,
        undefined,
        res,
      ),
  )

  if (isError(databaseTransactionResult)) {
    return databaseTransactionResult
  }

  const {
    db: newDatabaseInMemory,
    refs: newReferencesToInstances,
    instanceContainer: newInstanceContainer,
  } = databaseTransactionResult.value

  locals.setLocal("databaseInMemory", newDatabaseInMemory)
  locals.setLocal("referencesToInstances", newReferencesToInstances)

  return ok(newInstanceContainer)
}

export const deleteInstance = async (
  locals: TSONDBRequestLocals,
  entityName: string,
  instanceId: string,
): Promise<Result<InstanceContainer, Error>> => {
  const instanceContainer = getInstanceOfEntityFromDatabaseInMemory(
    locals.databaseInMemory,
    entityName,
    instanceId,
  )

  if (instanceContainer === undefined) {
    return error(new HTTPError(400, "Instance not found"))
  }

  const entity = locals.entitiesByName[entityName]

  if (entity === undefined) {
    return error(new HTTPError(400, "Entity not found"))
  }

  const oldChildInstances = getChildInstances(locals.databaseInMemory, entity, instanceId, true)

  const databaseTransactionResult = await runDatabaseTransaction(
    locals.dataRoot,
    locals.gitRoot ? locals.git : undefined,
    locals.entitiesByName,
    locals.databaseInMemory,
    locals.referencesToInstances,
    res =>
      saveInstanceTree(
        locals.validationOptions,
        locals.entitiesByName,
        undefined,
        undefined,
        locals.localeEntity,
        entityName,
        {
          id: instanceId,
          content: instanceContainer.content,
          childInstances: oldChildInstances,
          entityName,
        },
        undefined,
        undefined,
        res,
      ),
  )

  if (isError(databaseTransactionResult)) {
    return databaseTransactionResult
  }

  const {
    db: newDatabaseInMemory,
    refs: newReferencesToInstances,
    instanceContainer: oldInstanceContainer,
  } = databaseTransactionResult.value

  locals.setLocal("databaseInMemory", newDatabaseInMemory)
  locals.setLocal("referencesToInstances", newReferencesToInstances)

  return ok(oldInstanceContainer)
}
