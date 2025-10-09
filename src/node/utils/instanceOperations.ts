import { randomUUID } from "node:crypto"
import type { InstancesByEntityName } from "../../shared/utils/instances.ts"
import { error, isOk, map, ok, type Result } from "../../shared/utils/result.ts"
import type { EntityDecl } from "../schema/declarations/EntityDecl.js"
import { createValidators, validateEntityDecl } from "../schema/index.ts"
import { getErrorMessageForDisplay } from "./error.ts"
import * as Files from "./files.ts"
import { isReferencedByOtherInstances, type ReferencesToInstances } from "./references.ts"

export const createNewId = () => randomUUID()

export const checkCreateInstancePossible = (
  localeEntity: EntityDecl | undefined,
  instancesByEntityName: InstancesByEntityName,
  entity: EntityDecl,
  instanceContent: unknown,
  customId: unknown,
): Result<string, [code: number, message: string]> => {
  const newInstanceId = entity === localeEntity ? customId : createNewId()

  if (typeof newInstanceId !== "string") {
    return error([400, `New identifier "${String(newInstanceId)}" is not a string`])
  }

  if (
    localeEntity === entity &&
    instancesByEntityName[entity.name]?.some(instance => instance.id === newInstanceId)
  ) {
    return error([400, `Duplicate id "${newInstanceId}" for locale entity`])
  }

  return map(
    checkUpdateInstancePossible(instancesByEntityName, entity, instanceContent),
    () => newInstanceId,
  )
}

export const createInstance = async (
  dataRoot: string,
  localeEntity: EntityDecl | undefined,
  instancesByEntityName: InstancesByEntityName,
  entity: EntityDecl,
  instanceContent: unknown,
  customId: unknown,
): Promise<Result<string, [code: number, message: string]>> => {
  const prerequisiteCheckResult = checkCreateInstancePossible(
    localeEntity,
    instancesByEntityName,
    entity,
    instanceContent,
    customId,
  )

  if (isOk(prerequisiteCheckResult)) {
    const newInstanceId = prerequisiteCheckResult.value
    return unsafeWriteInstance(dataRoot, entity, newInstanceId, instanceContent)
  } else {
    return prerequisiteCheckResult
  }
}

export const checkUpdateInstancePossible = (
  instancesByEntityName: InstancesByEntityName,
  entity: EntityDecl,
  instanceContent: unknown,
): Result<void, [code: number, message: string]> => {
  const validationErrors = validateEntityDecl(
    createValidators(instancesByEntityName, false),
    entity,
    instanceContent,
  )

  if (validationErrors.length > 0) {
    return error([400, validationErrors.map(getErrorMessageForDisplay).join("\n\n")])
  } else {
    return ok()
  }
}

export const checkCreateNonLocaleInstancePossible = checkUpdateInstancePossible

export const unsafeWriteInstance = async (
  dataRoot: string,
  entity: EntityDecl,
  instanceId: string,
  instanceContent: unknown,
): Promise<Result<string, [code: number, message: string]>> => {
  try {
    await Files.writeInstance(dataRoot, entity, instanceId, instanceContent)
    return ok(instanceId)
  } catch (err) {
    return error([
      500,
      `Failed to write instance: ${err instanceof Error ? err.toString() : String(err)}`,
    ])
  }
}

export const updateInstance = async (
  dataRoot: string,
  instancesByEntityName: InstancesByEntityName,
  entity: EntityDecl,
  instanceId: string,
  instanceContent: unknown,
): Promise<Result<string, [code: number, message: string]>> => {
  const prerequisiteCheckResult = checkUpdateInstancePossible(
    instancesByEntityName,
    entity,
    instanceContent,
  )

  if (isOk(prerequisiteCheckResult)) {
    return unsafeWriteInstance(dataRoot, entity, instanceId, instanceContent)
  } else {
    return prerequisiteCheckResult
  }
}

export const checkDeleteInstancePossible = (
  referencesToInstances: ReferencesToInstances,
  instanceId: string,
): Result<void, [code: number, message: string]> => {
  if (isReferencedByOtherInstances(referencesToInstances, instanceId)) {
    return error([400, "Cannot delete instance that is referenced by other instances"])
  } else {
    return ok()
  }
}

export const unsafeDeleteInstance = async (
  dataRoot: string,
  entityName: string,
  instanceId: string,
): Promise<Result<string, [code: number, message: string]>> => {
  try {
    await Files.deleteInstance(dataRoot, entityName, instanceId)
    return ok(instanceId)
  } catch (err) {
    return error([
      500,
      `Failed to delete instance: ${err instanceof Error ? err.toString() : String(err)}`,
    ])
  }
}

export const deleteInstance = async (
  dataRoot: string,
  referencesToInstances: ReferencesToInstances,
  entityName: string,
  instanceId: string,
): Promise<Result<string, [code: number, message: string]>> => {
  const prerequisiteCheckResult = checkDeleteInstancePossible(referencesToInstances, instanceId)

  if (isOk(prerequisiteCheckResult)) {
    return unsafeDeleteInstance(dataRoot, entityName, instanceId)
  } else {
    return prerequisiteCheckResult
  }
}
