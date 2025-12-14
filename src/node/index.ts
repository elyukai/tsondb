import Debug from "debug"
import { mkdir } from "fs/promises"
import { join, sep } from "path"
import { stderr } from "process"
import { styleText } from "util"
import type { Output } from "../shared/output.ts"
import { isError } from "../shared/utils/result.ts"
import { parallelizeErrors } from "../shared/utils/validation.ts"
import type { HomeLayoutSection } from "./config.ts"
import { validateEntityDecl, type EntityDecl } from "./schema/declarations/EntityDecl.ts"
import { createValidationContext } from "./schema/Node.ts"
import { getEntities, type Schema } from "./schema/Schema.ts"
import type { ServerOptions } from "./server/index.ts"
import { createServer } from "./server/index.ts"
import { checkCustomConstraintsForAllEntities } from "./utils/customConstraints.ts"
import {
  asyncForEachInstanceInDatabaseInMemory,
  countInstancesInDatabaseInMemory,
  createDatabaseInMemory,
  getInstancesOfEntityFromDatabaseInMemory,
  type DatabaseInMemory,
} from "./utils/databaseInMemory.ts"
import { getAllInstanceOverviewsByEntityName } from "./utils/displayName.ts"
import {
  countError,
  countErrors,
  getErrorMessageForDisplay,
  wrapErrorsIfAny,
} from "./utils/error.ts"
import { getFileNameForId, writeInstance } from "./utils/files.ts"
import { checkUniqueConstraintsForAllEntities } from "./utils/unique.ts"

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

export type ValidationOptions = {
  checkReferentialIntegrity: boolean
  checkOnlyEntities: string[]
  checkTranslations?: {
    format: "mf2"

    /**
     * If set to `true`, translation keys will be treated as message format strings and their parameters must match the ones in the values.
     */
    matchParametersInKeys?: boolean
  }
}

const _validate = (
  dataRootPath: string,
  entities: EntityDecl[],
  databaseInMemory: DatabaseInMemory,
  locales: string[],
  options: Partial<ValidationOptions> = {},
): boolean => {
  const { checkReferentialIntegrity = true, checkOnlyEntities = [] } = options

  for (const onlyEntity of checkOnlyEntities) {
    if (!entities.find(entity => entity.name === onlyEntity)) {
      throw new Error(`Entity "${onlyEntity}" not found in schema`)
    }
  }

  const validationContext = createValidationContext(
    options,
    databaseInMemory,
    true,
    checkReferentialIntegrity,
  )

  debug("Checking structural integrity ...")

  const errors = (
    checkOnlyEntities.length > 0
      ? entities.filter(entity => checkOnlyEntities.includes(entity.name))
      : entities
  )
    .flatMap(entity =>
      parallelizeErrors(
        getInstancesOfEntityFromDatabaseInMemory(databaseInMemory, entity.name).map(instance =>
          wrapErrorsIfAny(
            `in file ${styleText("white", `"${dataRootPath}${sep}${styleText("bold", join(entity.name, getFileNameForId(instance.id)))}"`)}`,
            validateEntityDecl(validationContext, [], entity, instance.content),
          ),
        ),
      ),
    )
    .toSorted((a, b) => a.message.localeCompare(b.message))

  if (errors.length > 0) {
    const errorCount = countErrors(errors)
    debug(
      `${errorCount.toString()} structural integrity violation${errorCount === 1 ? "" : "s"} found`,
    )
  } else {
    debug("No structural integrity violations found")
  }

  if (errors.length === 0) {
    debug("Checking unique constraints ...")

    const entitiesByName = Object.fromEntries(entities.map(entity => [entity.name, entity]))

    const instanceOverviewsByEntityName = getAllInstanceOverviewsByEntityName(
      entitiesByName,
      databaseInMemory,
      locales,
    )

    const uniqueConstraintResult = checkUniqueConstraintsForAllEntities(
      databaseInMemory,
      entitiesByName,
      instanceOverviewsByEntityName,
    )

    if (isError(uniqueConstraintResult)) {
      const errorCount = countError(uniqueConstraintResult.error)
      debug(
        `${errorCount.toString()} unique constraint violation${errorCount === 1 ? "" : "s"} found`,
      )
      errors.push(uniqueConstraintResult.error)
    } else {
      debug("No unique constraint violations found")
    }

    debug("Checking custom constraints ...")

    const customConstraintResult = checkCustomConstraintsForAllEntities(
      databaseInMemory,
      entitiesByName,
      instanceOverviewsByEntityName,
    )

    if (isError(customConstraintResult)) {
      const errorCount = countError(customConstraintResult.error)
      debug(
        `${errorCount.toString()} custom constraint violation${errorCount === 1 ? "" : "s"} found`,
      )
      errors.push(customConstraintResult.error)
    } else {
      debug("No custom constraint violations found")
    }
  } else {
    debug("Skipping unique constraint checks due to previous structural integrity errors")
  }

  const totalInstanceCount = countInstancesInDatabaseInMemory(databaseInMemory)
  console.log(
    `${totalInstanceCount.toString()} instance${totalInstanceCount === 1 ? "" : "s"} checked`,
  )

  if (errors.length === 0) {
    console.log(styleText("green", "All instances are valid"))
    return true
  } else {
    const errorCount = countErrors(errors)
    console.error(
      styleText(
        "red",
        `${errorCount.toString()} validation error${errorCount === 1 ? "" : "s"} found\n\n${errors.map(err => getErrorMessageForDisplay(err)).join("\n\n")}`,
        { stream: stderr },
      ),
    )
    process.exitCode = 1
    return false
  }
}

export const validate = async (
  schema: Schema,
  dataRootPath: string,
  locales: string[],
  options?: Partial<ValidationOptions>,
) => {
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const databaseInMemory = await createDatabaseInMemory(dataRootPath, entities)
  _validate(dataRootPath, entities, databaseInMemory, locales, options)
}

export const generateAndValidate = async (
  schema: Schema,
  outputs: Output[],
  dataRootPath: string,
  locales: string[],
  validationOptions?: Partial<ValidationOptions>,
) => {
  await generateOutputs(schema, outputs)
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const databaseInMemory = await createDatabaseInMemory(dataRootPath, entities)
  _validate(dataRootPath, entities, databaseInMemory, locales, validationOptions)
}

export const serve = async (
  schema: Schema,
  dataRootPath: string,
  locales: string[],
  homeLayoutSections?: HomeLayoutSection[],
  serverOptions?: Partial<ServerOptions>,
  validationOptions?: Partial<ValidationOptions>,
  customStylesheetPath?: string,
) => {
  if (locales.length === 0) {
    throw new Error("At least one default locale must be specified to start the server.")
  }
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  debug("prepared folders")
  const databaseInMemory = await createDatabaseInMemory(dataRootPath, entities)
  debug("loaded instances")
  await createServer(
    schema,
    dataRootPath,
    databaseInMemory,
    locales,
    homeLayoutSections,
    serverOptions,
    validationOptions,
    customStylesheetPath,
  )
}

export const generateValidateAndServe = async (
  schema: Schema,
  outputs: Output[],
  dataRootPath: string,
  locales: string[],
  homeLayoutSections?: HomeLayoutSection[],
  serverOptions?: Partial<ServerOptions>,
  validationOptions?: Partial<ValidationOptions>,
  customStylesheetPath?: string,
) => {
  await generateOutputs(schema, outputs)
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const databaseInMemory = await createDatabaseInMemory(dataRootPath, entities)
  const isValid = _validate(dataRootPath, entities, databaseInMemory, locales, validationOptions)
  if (isValid) {
    await createServer(
      schema,
      dataRootPath,
      databaseInMemory,
      locales,
      homeLayoutSections,
      serverOptions,
      validationOptions,
      customStylesheetPath,
    )
  } else {
    console.error("Not starting server due to invalid database")
  }
}

export const format = async (schema: Schema, dataRootPath: string) => {
  const entities = getEntities(schema)
  await prepareFolders(dataRootPath, entities)
  const databaseInMemory = await createDatabaseInMemory(dataRootPath, entities)
  await asyncForEachInstanceInDatabaseInMemory(databaseInMemory, async (entityName, instance) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const entity = entities.find(entity => entity.name === entityName)!
    await writeInstance(dataRootPath, entity, instance.id, instance.content)
  })
}
