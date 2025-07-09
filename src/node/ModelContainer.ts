import Debug from "debug"
import { mkdir } from "fs/promises"
import { join } from "path"
import type { InstancesByEntityName } from "../shared/utils/instances.js"
import { parallelizeErrors } from "../shared/utils/validation.js"
import type { Output } from "./renderers/Output.js"
import type { Schema } from "./Schema.js"
import { getEntities } from "./Schema.js"
import type { EntityDecl } from "./schema/index.js"
import { createValidators, validateEntityDecl } from "./schema/index.js"
import type { ServerOptions } from "./server/index.js"
import { createServer } from "./server/index.js"
import { getErrorMessageForDisplay, wrapErrorsIfAny } from "./utils/error.js"
import { getInstancesByEntityName } from "./utils/instances.js"

const debug = Debug("tsondb:schema")

export interface ModelContainer {
  schema: Schema
  outputs: Output[]
  dataRootPath: string
}

export const ModelContainer = (options: {
  schema: Schema
  outputs: Output[]
  dataRootPath: string
}): ModelContainer => ({
  ...options,
})

const prepareFolders = async (modelContainer: ModelContainer, entities: EntityDecl[]) => {
  await mkdir(modelContainer.dataRootPath, { recursive: true })

  for (const entity of entities) {
    const entityDir = join(modelContainer.dataRootPath, entity.name)
    await mkdir(entityDir, { recursive: true })
  }
}

export const generateOutputs = async (modelContainer: ModelContainer): Promise<void> => {
  for (const output of modelContainer.outputs) {
    await output.run(modelContainer.schema)
  }
}

const _validate = (entities: EntityDecl[], instancesByEntityName: InstancesByEntityName): void => {
  const errors = entities.flatMap(entity =>
    parallelizeErrors(
      instancesByEntityName[entity.name]?.map(instance =>
        wrapErrorsIfAny(
          `in file "${entity.name}/${instance.fileName}"`,
          validateEntityDecl(createValidators(instancesByEntityName), entity, instance.content),
        ),
      ) ?? [],
    ),
  )

  if (errors.length === 0) {
    debug("All entities are valid")
  } else {
    debug("Errors:\n")
    for (const error of errors) {
      debug(getErrorMessageForDisplay(error) + "\n")
    }
    throw new Error("Validation failed")
  }
}

export const validate = async (modelContainer: ModelContainer) => {
  const entities = getEntities(modelContainer.schema)
  await prepareFolders(modelContainer, entities)
  const instancesByEntityName = await getInstancesByEntityName(
    modelContainer.dataRootPath,
    entities,
  )
  _validate(entities, instancesByEntityName)
}

export const generateAndValidate = async (modelContainer: ModelContainer) => {
  await generateOutputs(modelContainer)
  const entities = getEntities(modelContainer.schema)
  await prepareFolders(modelContainer, entities)
  const instancesByEntityName = await getInstancesByEntityName(
    modelContainer.dataRootPath,
    entities,
  )
  _validate(entities, instancesByEntityName)
}

export const serve = async (
  modelContainer: ModelContainer,
  serverOptions?: Partial<ServerOptions>,
) => {
  const entities = getEntities(modelContainer.schema)
  await prepareFolders(modelContainer, entities)
  const instancesByEntityName = await getInstancesByEntityName(
    modelContainer.dataRootPath,
    entities,
  )
  await createServer(modelContainer, instancesByEntityName, serverOptions)
}

export const generateValidateAndServe = async (
  modelContainer: ModelContainer,
  serverOptions?: Partial<ServerOptions>,
) => {
  await generateOutputs(modelContainer)
  const entities = getEntities(modelContainer.schema)
  await prepareFolders(modelContainer, entities)
  const instancesByEntityName = await getInstancesByEntityName(
    modelContainer.dataRootPath,
    entities,
  )
  _validate(entities, instancesByEntityName)
  await createServer(modelContainer, instancesByEntityName, serverOptions)
}
