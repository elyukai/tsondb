import Debug from "debug"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import type { InstancesByEntityName } from "../shared/utils/instances.ts"
import { parallelizeErrors } from "../shared/utils/validation.ts"
import type { Output } from "./renderers/Output.ts"
import type { Schema } from "./Schema.ts"
import { getEntities } from "./Schema.ts"
import type { EntityDecl } from "./schema/index.ts"
import { createValidators, validateEntityDecl } from "./schema/index.ts"
import type { ServerOptions } from "./server/index.ts"
import { createServer } from "./server/index.ts"
import { countErrors, getErrorMessageForDisplay, wrapErrorsIfAny } from "./utils/error.ts"
import { formatInstance, getInstancesByEntityName } from "./utils/instances.ts"

const debug = Debug("tsondb:schema")

const prepareFolders = async (dataRootPath: string, entities: EntityDecl[]) => {
  await mkdir(dataRootPath, { recursive: true })

  for (const entity of entities) {
    const entityDir = join(dataRootPath, entity.name)
    await mkdir(entityDir, { recursive: true })
  }
}

export const generateOutputs = async (schema: Schema, outputs: Output[]): Promise<void> => {
  for (const output of outputs) {
    await output.run(schema)
  }
}

const _validate = (
  dataRootPath: string,
  entities: EntityDecl[],
  instancesByEntityName: InstancesByEntityName,
): void => {
  const errors = entities
    .flatMap(entity =>
      parallelizeErrors(
        instancesByEntityName[entity.name]?.map(instance =>
          wrapErrorsIfAny(
            `in file "${join(dataRootPath, entity.name, instance.fileName)}"`,
            validateEntityDecl(createValidators(instancesByEntityName), entity, instance.content),
          ),
        ) ?? [],
      ),
    )
    .toSorted((a, b) => a.message.localeCompare(b.message))

  if (errors.length === 0) {
    debug("All entities are valid")
  } else {
    debug("Errors:\n")
    for (const error of errors) {
      debug(getErrorMessageForDisplay(error) + "\n")
    }
    throw new Error(`Validation failed with ${countErrors(errors).toString()} errors`)
  }
}

export const validate = async (schema: Schema, dataRootPath: string) => {
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const instancesByEntityName = await getInstancesByEntityName(dataRootPath, entities)
  _validate(dataRootPath, entities, instancesByEntityName)
}

export const generateAndValidate = async (
  schema: Schema,
  outputs: Output[],
  dataRootPath: string,
) => {
  await generateOutputs(schema, outputs)
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const instancesByEntityName = await getInstancesByEntityName(dataRootPath, entities)
  _validate(dataRootPath, entities, instancesByEntityName)
}

export const serve = async (
  schema: Schema,
  dataRootPath: string,
  serverOptions?: Partial<ServerOptions>,
) => {
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const instancesByEntityName = await getInstancesByEntityName(dataRootPath, entities)
  await createServer(schema, dataRootPath, instancesByEntityName, serverOptions)
}

export const generateValidateAndServe = async (
  schema: Schema,
  outputs: Output[],
  dataRootPath: string,
  serverOptions?: Partial<ServerOptions>,
) => {
  await generateOutputs(schema, outputs)
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const instancesByEntityName = await getInstancesByEntityName(dataRootPath, entities)
  _validate(dataRootPath, entities, instancesByEntityName)
  await createServer(schema, dataRootPath, instancesByEntityName, serverOptions)
}

export const format = async (schema: Schema, dataRootPath: string) => {
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const instancesByEntityName = await getInstancesByEntityName(dataRootPath, entities)

  for (const entityName in instancesByEntityName) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const entity = entities.find(entity => entity.name === entityName)!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    for (const instance of instancesByEntityName[entityName]!) {
      await writeFile(
        join(dataRootPath, entityName, instance.fileName),
        formatInstance(entity, instance.content),
        { encoding: "utf-8" },
      )
    }
  }
}
