import { randomUUID } from "node:crypto"
import type { InstanceContent } from "../../shared/utils/instances.ts"
import { error, map, ok, then, type Result } from "../../shared/utils/result.ts"
import type { EntityDecl } from "../schema/declarations/EntityDecl.ts"
import { createValidators, validateEntityDecl } from "../schema/index.ts"
import {
  getInstanceOfEntityFromDatabaseInMemory,
  type DatabaseInMemory,
} from "./databaseInMemory.ts"
import { deleteInstanceT, setInstanceT, type TransactionResult } from "./databaseTransactions.ts"
import { getErrorMessageForDisplay, HTTPError } from "./error.ts"
import { isReferencedByOtherInstances, type ReferencesToInstances } from "./references.ts"

export const createNewId = () => randomUUID()

const checkCreateInstancePossible = (
  localeEntity: EntityDecl | undefined,
  databaseInMemory: DatabaseInMemory,
  entity: EntityDecl,
  instanceContent: InstanceContent,
  customId: unknown,
): Result<string, HTTPError> => {
  const newInstanceId = entity === localeEntity ? customId : createNewId()

  if (typeof newInstanceId !== "string") {
    return error(new HTTPError(400, `New identifier "${String(newInstanceId)}" is not a string`))
  }

  if (
    localeEntity === entity &&
    getInstanceOfEntityFromDatabaseInMemory(databaseInMemory, entity.name, newInstanceId) !==
      undefined
  ) {
    return error(new HTTPError(400, `Duplicate id "${newInstanceId}" for locale entity`))
  }

  return map(
    checkUpdateInstancePossible(databaseInMemory, entity, instanceContent),
    () => newInstanceId,
  )
}

export const createInstance = (
  res: TransactionResult,
  localeEntity: EntityDecl | undefined,
  entity: EntityDecl,
  instanceContent: InstanceContent,
  customId: unknown,
): TransactionResult<{ instanceId: string }> =>
  then(res, data =>
    then(
      checkCreateInstancePossible(localeEntity, data.db, entity, instanceContent, customId),
      newInstanceId =>
        map(
          setInstanceT(ok(data), entity, { id: newInstanceId, content: instanceContent }),
          data => ({ ...data, instanceId: newInstanceId }),
        ),
    ),
  )

const checkUpdateInstancePossible = (
  databaseInMemory: DatabaseInMemory,
  entity: EntityDecl,
  instanceContent: InstanceContent,
): Result<void, HTTPError> => {
  const validationErrors = validateEntityDecl(
    createValidators(databaseInMemory, false),
    [],
    entity,
    instanceContent,
  )

  if (validationErrors.length > 0) {
    return error(new HTTPError(400, validationErrors.map(getErrorMessageForDisplay).join("\n\n")))
  } else {
    return ok()
  }
}

export const updateInstance = (
  res: TransactionResult,
  entity: EntityDecl,
  instanceId: string,
  instanceContent: InstanceContent,
): TransactionResult =>
  then(res, data =>
    then(checkUpdateInstancePossible(data.db, entity, instanceContent), () =>
      setInstanceT(ok(data), entity, { id: instanceId, content: instanceContent }),
    ),
  )

const checkDeleteInstancePossible = (
  referencesToInstances: ReferencesToInstances,
  instanceId: string,
): Result<void, HTTPError> => {
  if (isReferencedByOtherInstances(referencesToInstances, instanceId)) {
    return error(new HTTPError(400, "Cannot delete instance that is referenced by other instances"))
  } else {
    return ok()
  }
}

export const deleteInstance = (
  res: TransactionResult,
  entity: EntityDecl,
  instanceId: string,
): TransactionResult =>
  then(res, data =>
    then(checkDeleteInstancePossible(data.refs, instanceId), () =>
      deleteInstanceT(ok(data), entity, instanceId),
    ),
  )
