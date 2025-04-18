import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import { v4 as uuidv4 } from "uuid"
import { ModelContainer } from "../ModelContainer.js"
import { EntityDecl, validateEntityDecl } from "../schema/declarations/EntityDecl.js"
import { createValidators } from "../schema/Node.js"
import { getErrorMessageForDisplay } from "../utils/error.js"
import { InstanceContainer, InstancesByEntityName } from "../utils/instances.js"
import { error, ok, Result } from "../utils/result.js"

export const createInstance = async (
  modelContainer: ModelContainer,
  entitiesByName: Record<string, EntityDecl>,
  instancesByEntityName: InstancesByEntityName,
  entityName: string,
  instance: unknown,
  idQueryParam: unknown,
): Promise<Result<InstanceContainer, [code: number, message: string]>> => {
  const entity = entitiesByName[entityName]!

  const validationErrors = validateEntityDecl(
    createValidators(instancesByEntityName),
    entity,
    instance,
  )

  if (validationErrors.length > 0) {
    return error([400, validationErrors.map(getErrorMessageForDisplay).join("\n\n")])
  }

  if (modelContainer.schema.localeEntity === entity && typeof idQueryParam !== "string") {
    return error([400, "Missing id for locale entity"])
  }

  const id = modelContainer.schema.localeEntity === entity ? (idQueryParam as string) : uuidv4()

  const fileName = `${id}.json`

  await writeFile(
    join(modelContainer.dataRootPath, entity.name, fileName),
    JSON.stringify(instance, undefined, 2),
    { encoding: "utf-8" },
  )

  const instanceContainer: InstanceContainer = {
    fileName,
    id,
    content: instance,
  }

  instancesByEntityName[entity.name] = [
    ...(instancesByEntityName[entity.name] ?? []),
    instanceContainer,
  ]

  return ok(instanceContainer)
}

export const updateInstance = async (
  modelContainer: ModelContainer,
  entitiesByName: Record<string, EntityDecl>,
  instancesByEntityName: InstancesByEntityName,
  entityName: string,
  id: string,
  instance: unknown,
): Promise<Result<InstanceContainer, [code: number, message: string]>> => {
  const instanceContainer = instancesByEntityName[entityName]?.find(instance => instance.id === id)

  if (instanceContainer === undefined) {
    return error([404, "Instance not found"])
  }

  const entity = entitiesByName[entityName]!

  const validationErrors = validateEntityDecl(
    createValidators(instancesByEntityName),
    entity,
    instance,
  )

  if (validationErrors.length > 0) {
    return error([400, validationErrors.map(getErrorMessageForDisplay).join("\n\n")])
  }

  await writeFile(
    join(modelContainer.dataRootPath, entity.name, instanceContainer.fileName),
    JSON.stringify(instance, undefined, 2),
    { encoding: "utf-8" },
  )

  instanceContainer.content = instance

  return ok(instanceContainer)
}
