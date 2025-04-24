import { rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { SimpleGit } from "simple-git"
import { v4 as uuidv4 } from "uuid"
import { EntityDecl, validateEntityDecl } from "../../schema/declarations/EntityDecl.js"
import { formatValue } from "../../schema/index.js"
import { createValidators } from "../../schema/Node.js"
import { InstanceContainer, InstancesByEntityName } from "../../shared/utils/instances.js"
import { getErrorMessageForDisplay } from "../../utils/error.js"
import { getGitFileStatusFromStatusResult } from "../../utils/git.js"
import { error, ok, Result } from "../../utils/result.js"

export const createInstance = async (
  dataRootPath: string,
  localeEntity: EntityDecl | undefined,
  entitiesByName: Record<string, EntityDecl>,
  instancesByEntityName: InstancesByEntityName,
  entityName: string,
  instance: unknown,
  idQueryParam: unknown,
  git: SimpleGit,
  gitRoot: string | undefined,
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

  if (localeEntity === entity && typeof idQueryParam !== "string") {
    return error([400, "Missing id for locale entity"])
  }

  const id = localeEntity === entity ? (idQueryParam as string) : uuidv4()

  if (
    localeEntity === entity &&
    instancesByEntityName[entity.name]!.some(instance => instance.id === id)
  ) {
    return error([400, `Duplicate id "${id}" for locale entity`])
  }

  const fileName = `${id}.json`

  await writeFile(
    join(dataRootPath, entity.name, fileName),
    JSON.stringify(formatValue(entity.type.value, instance), undefined, 2),
    { encoding: "utf-8" },
  )

  const instanceContainer: InstanceContainer = {
    fileName,
    id,
    content: instance,
    gitStatus:
      gitRoot === undefined
        ? undefined
        : getGitFileStatusFromStatusResult(
            await git.status(),
            gitRoot,
            dataRootPath,
            entity.name,
            fileName,
          ),
  }

  instancesByEntityName[entity.name] = [
    ...(instancesByEntityName[entity.name] ?? []),
    instanceContainer,
  ]

  return ok(instanceContainer)
}

export const updateInstance = async (
  dataRootPath: string,
  entitiesByName: Record<string, EntityDecl>,
  instancesByEntityName: InstancesByEntityName,
  entityName: string,
  id: string,
  instance: unknown,
  git: SimpleGit,
  gitRoot: string | undefined,
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
    join(dataRootPath, entity.name, instanceContainer.fileName),
    JSON.stringify(formatValue(entity.type.value, instance), undefined, 2),
    { encoding: "utf-8" },
  )

  instanceContainer.content = instance
  instanceContainer.gitStatus =
    gitRoot === undefined
      ? undefined
      : getGitFileStatusFromStatusResult(
          await git.status(),
          gitRoot,
          dataRootPath,
          entity.name,
          instanceContainer.fileName,
        )

  return ok(instanceContainer)
}

export const deleteInstance = async (
  dataRootPath: string,
  instancesByEntityName: InstancesByEntityName,
  entityName: string,
  id: string,
): Promise<Result<InstanceContainer, [code: number, message: string]>> => {
  const instances = instancesByEntityName[entityName] ?? []
  const instanceContainerIndex = instances.findIndex(instance => instance.id === id)
  const instanceContainer = instances[instanceContainerIndex]

  if (instanceContainer === undefined) {
    return error([404, "Instance not found"])
  }

  try {
    await rm(join(dataRootPath, entityName, instanceContainer.fileName))
    instancesByEntityName[entityName] = [
      ...instances.slice(0, instanceContainerIndex),
      ...instances.slice(instanceContainerIndex + 1),
    ]
    return ok(instanceContainer)
  } catch (err) {
    return error([500, `Failed to delete instance: ${err}`])
  }
}
