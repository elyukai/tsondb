import Debug from "debug"
import { mkdir } from "fs/promises"
import { join, sep } from "path"
import { styleText } from "util"
import type { Output } from "../shared/output.ts"
import type { InstancesByEntityName } from "../shared/utils/instances.ts"
import { parallelizeErrors } from "../shared/utils/validation.ts"
import { validateEntityDecl, type EntityDecl } from "./schema/declarations/EntityDecl.ts"
import { createValidators } from "./schema/Node.ts"
import { getEntities, type Schema } from "./schema/Schema.ts"
import type { ServerOptions } from "./server/index.ts"
import { createServer } from "./server/index.ts"
import { countErrors, getErrorMessageForDisplay, wrapErrorsIfAny } from "./utils/error.ts"
import { getFileNameForId, writeInstance } from "./utils/files.ts"
import { getInstancesByEntityName } from "./utils/instances.ts"

const debug = Debug("tsondb:jsapi")

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

type ValidationOptions = {
  checkReferentialIntegrity: boolean
  checkOnlyEntities: string[]
}

const _validate = (
  dataRootPath: string,
  entities: EntityDecl[],
  instancesByEntityName: InstancesByEntityName,
  options: Partial<ValidationOptions> = {},
): void => {
  const { checkReferentialIntegrity = true, checkOnlyEntities = [] } = options

  for (const onlyEntity of checkOnlyEntities) {
    if (!entities.find(entity => entity.name === onlyEntity)) {
      throw new Error(`Entity "${onlyEntity}" not found in schema`)
    }
  }

  const validationHelpers = createValidators(instancesByEntityName, true, checkReferentialIntegrity)

  const errors = (
    checkOnlyEntities.length > 0
      ? entities.filter(entity => checkOnlyEntities.includes(entity.name))
      : entities
  )
    .flatMap(entity =>
      parallelizeErrors(
        instancesByEntityName[entity.name]?.map(instance =>
          wrapErrorsIfAny(
            `in file ${styleText("white", `"${dataRootPath}${sep}${styleText("bold", join(entity.name, getFileNameForId(instance.id)))}"`)}`,
            validateEntityDecl(validationHelpers, entity, instance.content),
          ),
        ) ?? [],
      ),
    )
    .toSorted((a, b) => a.message.localeCompare(b.message))

  if (errors.length === 0) {
    debug("All entities are valid")
  } else {
    console.error(
      styleText("red", "\n" + errors.map(err => getErrorMessageForDisplay(err)).join("\n\n")),
    )
    throw new Error(`Validation failed with ${countErrors(errors).toString()} errors`)
  }
}

export const validate = async (
  schema: Schema,
  dataRootPath: string,
  options?: Partial<ValidationOptions>,
) => {
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const instancesByEntityName = await getInstancesByEntityName(dataRootPath, entities)
  _validate(dataRootPath, entities, instancesByEntityName, options)
}

export const generateAndValidate = async (
  schema: Schema,
  outputs: Output[],
  dataRootPath: string,
  validationOptions?: Partial<ValidationOptions>,
) => {
  await generateOutputs(schema, outputs)
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const instancesByEntityName = await getInstancesByEntityName(dataRootPath, entities)
  _validate(dataRootPath, entities, instancesByEntityName, validationOptions)
}

export const serve = async (
  schema: Schema,
  dataRootPath: string,
  defaultLocales: string[],
  serverOptions?: Partial<ServerOptions>,
) => {
  if (defaultLocales.length === 0) {
    throw new Error("At least one default locale must be specified to start the server.")
  }
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  debug("prepared folders")
  const instancesByEntityName = await getInstancesByEntityName(dataRootPath, entities)
  debug("loaded instances")
  await createServer(schema, dataRootPath, instancesByEntityName, defaultLocales, serverOptions)
}

export const generateValidateAndServe = async (
  schema: Schema,
  outputs: Output[],
  dataRootPath: string,
  defaultLocales: string[],
  serverOptions?: Partial<ServerOptions>,
  validationOptions?: Partial<ValidationOptions>,
) => {
  await generateOutputs(schema, outputs)
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const instancesByEntityName = await getInstancesByEntityName(dataRootPath, entities)
  _validate(dataRootPath, entities, instancesByEntityName, validationOptions)
  await createServer(schema, dataRootPath, instancesByEntityName, defaultLocales, serverOptions)
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
      await writeInstance(dataRootPath, entity, instance.id, instance.content)
    }
  }
}
