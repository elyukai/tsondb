import { exists } from "@elyukai/utils/async/node"
import { nullableToArray } from "@elyukai/utils/nullable"
import { isError } from "@elyukai/utils/result"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import Debug from "debug"
import { mkdir, readFile, stat, writeFile } from "node:fs/promises"
import { findPackageJSON } from "node:module"
import { join, sep } from "node:path"
import { stderr } from "node:process"
import { styleText } from "node:util"
import type { SimpleGit, StatusResult } from "simple-git"
import { NodeKind } from "../shared/schema/Node.ts"
import {
  countError,
  countErrors,
  getErrorMessageForDisplay,
  wrapErrorsIfAny,
} from "../shared/utils/error.ts"
import type { InstanceContent } from "../shared/utils/instances.ts"
import { parallelizeErrors } from "../shared/utils/validation.ts"
import type { DefaultTSONDBTypes, ValidationOptions } from "./index.ts"
import type { Output } from "./output.ts"
import { getDisplayName, getDisplayNameWithId } from "./schema/detached.ts"
import type { EntityDecl } from "./schema/dsl/index.ts"
import type {
  AnyEntityMap,
  AnySingletonEntityMap,
  RegisteredEntityMap,
  RegisteredSingletonEntityMap,
} from "./schema/generatedTypeHelpers.ts"
import { isEntityDecl } from "./schema/guards.ts"
import type { Schema } from "./schema/index.ts"
import { serializeNode } from "./schema/treeOperations/serialization.ts"
import {
  createEntityNameValidator,
  createReferenceValidator,
  validateDeclReferentialIntegrity,
  validateDeclStructuralIntegrity,
  type EntityNameValidator,
  type ReferenceValidator,
  type ValidationContext,
} from "./schema/treeOperations/validation.ts"
import { checkCustomConstraintsForAllEntities } from "./utils/customConstraints.ts"
import { DatabaseInMemory } from "./utils/databaseInMemory.ts"
import { getAllInstanceOverviewsByEntityName, getInstanceOverview } from "./utils/displayName.ts"
import { getFileNameForId, getSingletonFileName } from "./utils/files.ts"
import { attachGitStatusToDatabaseInMemory } from "./utils/git.ts"
import { getReferencesToInstances, type ReferencesToInstances } from "./utils/references.ts"
import { checkUniqueConstraintsForAllEntities } from "./utils/unique.ts"

const debug = Debug("tsondb:class:shared")

interface MetaFile {
  version: string
  schemaVersion: string
}

const getMetaFilePath = (dataRootPath: string) => join(dataRootPath, ".meta.json")

export const getTSONDBVersion = async (): Promise<string> => {
  const packageJsonPath = findPackageJSON(".", import.meta.url)
  if (!packageJsonPath) {
    throw new Error("Could not find package.json for TSONDB")
  }
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"))
  return packageJson.version
}

export const readMetaFile = async (dataRootPath: string): Promise<MetaFile> =>
  JSON.parse(await readFile(getMetaFilePath(dataRootPath), "utf-8")) as MetaFile
// try {
// } catch (err) {
//   if (err instanceof Error && (err as NodeJS.ErrnoException).code === "ENOENT") {
//     return undefined
//   }
//   throw err
// }

export const writeMetaFile = async (dataRootPath: string, meta: MetaFile): Promise<void> =>
  writeFile(getMetaFilePath(dataRootPath), JSON.stringify(meta, null, 2), "utf-8")

export const prepareFolders = async (
  schemaVersion: string,
  dataRootPath: string,
  entities: EntityDecl[],
) => {
  await mkdir(dataRootPath, { recursive: true })

  await Promise.all(
    entities.map(entity => mkdir(join(dataRootPath, entity.name), { recursive: true })),
  )

  if (!(await exists(getMetaFilePath(dataRootPath)))) {
    const newMetaFile: MetaFile = {
      version: await getTSONDBVersion(),
      schemaVersion,
    }
    await writeMetaFile(dataRootPath, newMetaFile)
  }
}

export const generateOutputs = async <T extends DefaultTSONDBTypes>(
  schema: Schema<T>,
  outputs: Output[],
): Promise<void> => {
  await Promise.all(outputs.map(output => output.run(schema)))
}

export const checkLocales = <T extends DefaultTSONDBTypes>(
  schema: Schema<T>,
  data: DatabaseInMemory<T["entityMap"]>,
  locales: string[],
) => {
  const { localeEntity } = schema
  if (
    localeEntity &&
    !locales.every(locale => data.hasInstanceOfEntityById(localeEntity.name, locale))
  ) {
    throw new Error("All provided locales must exist in the database.")
  }
}

export type TSONDBGit = { client: SimpleGit; root: string }

const loadDataAndMeta = async <T extends DefaultTSONDBTypes>(
  dataRootPath: string,
  schema: Schema<T>,
  allowCompressedFile: boolean,
): Promise<{
  data: DatabaseInMemory<T["entityMap"], T["singletonEntityMap"]>
  meta: MetaFile
}> => {
  const rootStat = await stat(dataRootPath).catch(() => undefined)

  if (rootStat === undefined) {
    throw new Error(`Data root path "${dataRootPath}" does not exist.`)
  }

  if (rootStat.isFile()) {
    if (!allowCompressedFile) {
      throw new Error(
        `A writable database does not allow writing to a compressed database, but "${dataRootPath}" is a file.`,
      )
    }

    debug("loading compressed database into memory ...")

    const compressedData = JSON.parse(
      await readFile(dataRootPath, "utf-8"),
    ) as CompressedDatabaseFile<T["entityMap"], T["singletonEntityMap"]>

    const data = await DatabaseInMemory.loadFromCompressedFile<
      T["entityMap"],
      T["singletonEntityMap"]
    >(compressedData, schema.isEntityName.bind(schema))
    debug("done")
    return { data, meta: compressedData.meta }
  } else if (rootStat.isDirectory()) {
    debug("loading database into memory ...")
    const data = await DatabaseInMemory.load<T["entityMap"], T["singletonEntityMap"]>(
      dataRootPath,
      schema.entities,
      schema.singletonEntities,
    )
    const meta = await readMetaFile(dataRootPath)
    debug("done")
    return { data, meta }
  } else {
    throw new Error(`Data root path "${dataRootPath}" is not a directory.`)
  }
}

export const initData = async <T extends DefaultTSONDBTypes>(
  dataRootPath: string,
  schema: Schema<T>,
  locales: string[],
  git: TSONDBGit | undefined,
  gitStatus: StatusResult | undefined,
  skipReferenceCache: boolean,
  allowCompressedFile: boolean,
): Promise<{
  data: DatabaseInMemory<T["entityMap"], T["singletonEntityMap"]>
  referencesToInstances: ReferencesToInstances
  meta: MetaFile
}> => {
  const { data, meta } = await loadDataAndMeta(dataRootPath, schema, allowCompressedFile)

  checkLocales(schema, data, locales)

  const serializedDeclarationsByName = Object.fromEntries(
    schema.resolvedDeclarations.map(decl => [decl.name, serializeNode(decl)]),
  )

  let referencesToInstances: ReferencesToInstances = {}
  if (!skipReferenceCache) {
    debug("creating references cache ...")
    referencesToInstances = await getReferencesToInstances(data, serializedDeclarationsByName)
    debug("done")
  } else {
    debug("skipping references cache creation")
  }

  if (git) {
    const status = gitStatus ?? (await git.client.status())
    const dataWithGit = attachGitStatusToDatabaseInMemory(data, dataRootPath, git.root, status)
    debug("attached git status to instances")
    return { data: dataWithGit, referencesToInstances, meta }
  } else {
    return { data, referencesToInstances, meta }
  }
}

export const validate = <T extends DefaultTSONDBTypes>(
  properties: {
    data: DatabaseInMemory<T["entityMap"], T["singletonEntityMap"]>
    schema: Schema<T>
    validationOptions: ValidationOptions
    dataRootPath: string
    locales: string[]
  },
  options: {
    logToConsole?: boolean
    skipStructuralValidation?: boolean
    changedEntities?: Extract<keyof (T["entityMap"] & T["singletonEntityMap"]), string>[]
  } = {},
): Error[] => {
  const { data, schema, validationOptions, dataRootPath, locales } = properties
  const { checkReferentialIntegrity, checkOnlyEntities } = validationOptions
  const {
    skipStructuralValidation = false,
    logToConsole = true,
    changedEntities: changedEntityNames,
  } = options
  const entities = [...schema.entities, ...schema.singletonEntities]
  const getEntity = schema.getEntity.bind(schema)

  for (const onlyEntity of checkOnlyEntities) {
    if (!entities.find(entity => entity.name === onlyEntity)) {
      throw new Error(`Entity "${onlyEntity}" not found in schema`)
    }
  }

  const onlyEntities =
    checkOnlyEntities.length > 0
      ? entities.filter(entity => checkOnlyEntities.includes(entity.name))
      : entities

  const changedEntities = changedEntityNames
    ? entities.filter(entity => changedEntityNames.includes(entity.name))
    : undefined

  const validationContext: ValidationContext = { validationOptions, useStyling: true }

  const errors: Error[] = []
  const summary: string[] = []

  const debugAndAddToSummary = (message: string) => {
    debug(message)
    summary.push(message)
  }

  if (!skipStructuralValidation) {
    debug("Checking structural integrity ...")

    const structureErrors = onlyEntities
      .flatMap(entity => {
        switch (entity.kind) {
          case NodeKind.EntityDecl:
            return parallelizeErrors(
              data
                .getAllInstanceContainersOfEntity(entity.name)
                .map(instance =>
                  wrapErrorsIfAny(
                    `in file ${styleText("white", `"${dataRootPath}${sep}${styleText("bold", join(entity.name, getFileNameForId(instance.id)))}"`)}`,
                    validateDeclStructuralIntegrity(
                      validationContext,
                      [],
                      entity,
                      [],
                      instance.content,
                    ),
                  ),
                ),
            )

          case NodeKind.SingletonEntityDecl: {
            const instance = data.getSingletonInstanceContainerOfEntity(entity.name)
            if (instance) {
              return nullableToArray(
                wrapErrorsIfAny(
                  `in file ${styleText("white", `"${dataRootPath}${sep}${styleText("bold", getSingletonFileName(entity.name))}"`)}`,
                  validateDeclStructuralIntegrity(
                    validationContext,
                    [],
                    entity,
                    [],
                    instance.content,
                  ),
                ),
              )
            }

            return []
          }
          default:
            return assertExhaustive(entity)
        }
      })
      .toSorted((a, b) => a.message.localeCompare(b.message))

    if (structureErrors.length > 0) {
      const errorCount = countErrors(structureErrors)
      debugAndAddToSummary(
        `${errorCount.toString()} structural integrity violation${errorCount === 1 ? "" : "s"} found`,
      )
      errors.push(...structureErrors)
    } else {
      debug("No structural integrity violations found")
    }
  }

  if (errors.length === 0) {
    if (!skipStructuralValidation) {
      if (checkReferentialIntegrity) {
        debug("Checking referential integrity ...")

        const entityNameValidator: EntityNameValidator = createEntityNameValidator(
          schema.isEntityName.bind(schema),
          true,
        )

        const referenceValidator: ReferenceValidator = createReferenceValidator(
          schema.isEntityName.bind(schema),
          data,
          true,
        )

        const referenceErrors = onlyEntities
          .flatMap(entity => {
            switch (entity.kind) {
              case NodeKind.EntityDecl:
                return parallelizeErrors(
                  data
                    .getAllInstanceContainersOfEntity(entity.name)
                    .map(instance =>
                      wrapErrorsIfAny(
                        `in file ${styleText("white", `"${dataRootPath}${sep}${styleText("bold", join(entity.name, getFileNameForId(instance.id)))}"`)}`,
                        validateDeclReferentialIntegrity(
                          validationContext,
                          entityNameValidator,
                          referenceValidator,
                          [],
                          entity,
                          [],
                          instance.content,
                        ),
                      ),
                    ),
                )

              case NodeKind.SingletonEntityDecl: {
                const instance = data.getSingletonInstanceContainerOfEntity(entity.name)
                if (instance) {
                  return nullableToArray(
                    wrapErrorsIfAny(
                      `in file ${styleText("white", `"${dataRootPath}${sep}${styleText("bold", getSingletonFileName(entity.name))}"`)}`,
                      validateDeclReferentialIntegrity(
                        validationContext,
                        entityNameValidator,
                        referenceValidator,
                        [],
                        entity,
                        [],
                        instance.content,
                      ),
                    ),
                  )
                }

                return []
              }
              default:
                return assertExhaustive(entity)
            }
          })
          .toSorted((a, b) => a.message.localeCompare(b.message))

        if (referenceErrors.length > 0) {
          const errorCount = countErrors(referenceErrors)
          debugAndAddToSummary(
            `${errorCount.toString()} referential integrity violation${errorCount === 1 ? "" : "s"} found`,
          )
          errors.push(...referenceErrors)
        } else {
          debug("No referential integrity violations found")
        }
      } else {
        debug("Disabled referential integrity checks, skipping them")
      }
    }

    debug("Checking unique constraints ...")

    const instanceOverviewsByEntityName = getAllInstanceOverviewsByEntityName(
      getEntity,
      data,
      locales,
    )

    const uniqueConstraintResult = checkUniqueConstraintsForAllEntities(
      data,
      (changedEntities ?? onlyEntities).filter(e => isEntityDecl(e)),
      instanceOverviewsByEntityName,
    )

    if (isError(uniqueConstraintResult)) {
      const errorCount = countError(uniqueConstraintResult.error)
      debugAndAddToSummary(
        `${errorCount.toString()} unique constraint violation${errorCount === 1 ? "" : "s"} found`,
      )
      errors.push(uniqueConstraintResult.error)
    } else {
      debug("No unique constraint violations found")
    }

    debug("Checking custom constraints ...")

    const customConstraintResult = checkCustomConstraintsForAllEntities(
      (...args) => getDisplayName(getEntity, locales, data, ...args),
      (...args) => getDisplayNameWithId(getEntity, locales, data, ...args),
      (...args) =>
        getInstanceOverview(
          data.getInstanceContainerOfEntityById.bind(data),
          data.getAllChildInstanceContainersForParent.bind(data, getEntity),
          getEntity,
          locales,
          args,
        ),
      getEntity,
      data,
      entities,
    )

    if (isError(customConstraintResult)) {
      const errorCount = countError(customConstraintResult.error)
      debugAndAddToSummary(
        `${errorCount.toString()} custom constraint violation${errorCount === 1 ? "" : "s"} found`,
      )
      errors.push(customConstraintResult.error)
    } else {
      debug("No custom constraint violations found")
    }
  } else {
    debugAndAddToSummary("Skipping further checks due to previous structural integrity errors")
  }

  if (logToConsole) {
    console.log(`${data.totalSize.toString()} instance${data.totalSize === 1 ? "" : "s"} checked`)

    if (errors.length === 0) {
      console.log(styleText("green", "All instances are valid"))
    } else {
      const errorCount = countErrors(errors)
      console.error(
        styleText("red", `${errors.map(err => getErrorMessageForDisplay(err)).join("\n\n")}\n`, {
          stream: stderr,
        }),
      )
      console.error(styleText(["red", "bold"], "Summary", { stream: stderr }))
      console.error(
        styleText(
          "red",
          [
            `${errorCount.toString()} validation error${errorCount === 1 ? "" : "s"} found`,
            ...summary,
          ].join("\n"),
          { stream: stderr },
        ),
      )
    }
  }

  return errors
}

export type CompressedDatabaseFile<
  EM extends AnyEntityMap = RegisteredEntityMap,
  SEM extends AnySingletonEntityMap = RegisteredSingletonEntityMap,
> = {
  meta: MetaFile
  data: Record<keyof EM, Record<string, InstanceContent>> & Record<keyof SEM, InstanceContent>
}

export const createCompressedDatabaseFile = <
  EM extends AnyEntityMap = RegisteredEntityMap,
  SEM extends AnySingletonEntityMap = RegisteredSingletonEntityMap,
>(
  data: DatabaseInMemory<EM, SEM>,
  schemaVersion: string,
): CompressedDatabaseFile<EM, SEM> => {
  const compressedData: CompressedDatabaseFile<EM, SEM> = {
    meta: {
      version: "1.0.0",
      schemaVersion,
    },
    data: Object.assign(
      {},
      Object.fromEntries(
        data
          .getAllInstances()
          .map(([entityName, instances]) => [
            entityName,
            Object.fromEntries(instances.map(instance => [instance.id, instance.content])),
          ]),
      ) as Record<keyof EM, Record<string, InstanceContent>>,
      Object.fromEntries(
        data
          .getAllSingletonInstances()
          .map(([entityName, container]) => [entityName, container.content]),
      ) as Record<keyof SEM, InstanceContent>,
    ),
  }

  return compressedData
}

export const isEntityPair = <
  EM extends AnyEntityMap = RegisteredEntityMap,
  SEM extends AnySingletonEntityMap = RegisteredSingletonEntityMap,
>(
  pair:
    | [Extract<keyof EM, string>, Record<string, InstanceContent>]
    | [Extract<keyof SEM, string>, InstanceContent],
  isEntityName: (
    entityName: Extract<keyof EM | keyof SEM, string>,
  ) => entityName is Extract<keyof EM, string>,
): pair is [Extract<keyof EM, string>, Record<string, InstanceContent>] => isEntityName(pair[0])
