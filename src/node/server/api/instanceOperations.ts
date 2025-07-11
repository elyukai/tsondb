import { rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { v4 as uuidv4 } from "uuid"
import { removeAt } from "../../../shared/utils/array.js"
import type { InstanceContainer } from "../../../shared/utils/instances.js"
import type { Result } from "../../../shared/utils/result.js"
import { error, ok } from "../../../shared/utils/result.js"
import { validateEntityDecl } from "../../schema/declarations/EntityDecl.js"
import { createValidators } from "../../schema/Node.js"
import { getErrorMessageForDisplay } from "../../utils/error.js"
import { getGitFileStatusFromStatusResult } from "../../utils/git.js"
import { formatInstance } from "../../utils/instances.ts"
import { updateReferencesToInstances } from "../../utils/references.js"
import type { TSONDBRequestLocals } from "../index.js"

export const createInstance = async (
  locals: TSONDBRequestLocals,
  entityName: string,
  instance: unknown,
  idQueryParam: unknown,
): Promise<Result<InstanceContainer, [code: number, message: string]>> => {
  const entity = locals.entitiesByName[entityName]

  if (entity === undefined) {
    return error([400, "Entity not found"])
  }

  const validationErrors = validateEntityDecl(
    createValidators(locals.instancesByEntityName),
    entity,
    instance,
  )

  if (validationErrors.length > 0) {
    return error([400, validationErrors.map(getErrorMessageForDisplay).join("\n\n")])
  }

  if (locals.localeEntity === entity && typeof idQueryParam !== "string") {
    return error([400, "Missing id for locale entity"])
  }

  const id = locals.localeEntity === entity ? (idQueryParam as string) : uuidv4()

  if (
    locals.localeEntity === entity &&
    locals.instancesByEntityName[entity.name]?.some(instance => instance.id === id)
  ) {
    return error([400, `Duplicate id "${id}" for locale entity`])
  }

  const fileName = `${id}.json`

  await writeFile(join(locals.dataRoot, entity.name, fileName), formatInstance(entity, instance), {
    encoding: "utf-8",
  })

  const instanceContainer: InstanceContainer = {
    fileName,
    id,
    content: instance,
    gitStatus:
      locals.gitRoot === undefined
        ? undefined
        : getGitFileStatusFromStatusResult(
            await locals.git.status(),
            locals.gitRoot,
            locals.dataRoot,
            entity.name,
            fileName,
          ),
  }

  locals.instancesByEntityName[entity.name] = [
    ...(locals.instancesByEntityName[entity.name] ?? []),
    instanceContainer,
  ]

  Object.assign(
    locals.referencesToInstances,
    updateReferencesToInstances(
      locals.entitiesByName,
      locals.referencesToInstances,
      entity.name,
      id,
      undefined,
      instance,
    ),
  )

  return ok(instanceContainer)
}

export const updateInstance = async (
  locals: TSONDBRequestLocals,
  entityName: string,
  instanceId: string,
  instance: unknown,
): Promise<Result<InstanceContainer, [code: number, message: string]>> => {
  const instanceContainer = locals.instancesByEntityName[entityName]?.find(
    instance => instance.id === instanceId,
  )

  if (instanceContainer === undefined) {
    return error([404, "Instance not found"])
  }

  const entity = locals.entitiesByName[entityName]

  if (entity === undefined) {
    return error([400, "Entity not found"])
  }

  const validationErrors = validateEntityDecl(
    createValidators(locals.instancesByEntityName),
    entity,
    instance,
  )

  if (validationErrors.length > 0) {
    return error([400, validationErrors.map(getErrorMessageForDisplay).join("\n\n")])
  }

  await writeFile(
    join(locals.dataRoot, entity.name, instanceContainer.fileName),
    formatInstance(entity, instance),
    { encoding: "utf-8" },
  )

  const oldInstance = instanceContainer.content

  instanceContainer.content = instance
  instanceContainer.gitStatus =
    locals.gitRoot === undefined
      ? undefined
      : getGitFileStatusFromStatusResult(
          await locals.git.status(),
          locals.gitRoot,
          locals.dataRoot,
          entity.name,
          instanceContainer.fileName,
        )

  Object.assign(
    locals.referencesToInstances,
    updateReferencesToInstances(
      locals.entitiesByName,
      locals.referencesToInstances,
      entity.name,
      instanceId,
      oldInstance,
      instance,
    ),
  )

  return ok(instanceContainer)
}

export const deleteInstance = async (
  locals: TSONDBRequestLocals,
  entityName: string,
  instanceId: string,
): Promise<Result<InstanceContainer, [code: number, message: string]>> => {
  const instances = locals.instancesByEntityName[entityName] ?? []
  const instanceContainerIndex = instances.findIndex(instance => instance.id === instanceId)
  const instanceContainer = instances[instanceContainerIndex]

  if (instanceContainer === undefined) {
    return error([404, "Instance not found"])
  }

  if (locals.referencesToInstances[instanceId]?.some(ref => ref !== instanceId)) {
    return error([400, "Cannot delete instance that is referenced by other instances"])
  }

  try {
    await rm(join(locals.dataRoot, entityName, instanceContainer.fileName))

    locals.instancesByEntityName[entityName] = removeAt(instances, instanceContainerIndex)

    Object.assign(
      locals.referencesToInstances,
      updateReferencesToInstances(
        locals.entitiesByName,
        locals.referencesToInstances,
        entityName,
        instanceId,
        instanceContainer.content,
        undefined,
      ),
    )

    return ok(instanceContainer)
  } catch (err) {
    return error([
      500,
      `Failed to delete instance: ${err instanceof Error ? err.toString() : String(err)}`,
    ])
  }
}
