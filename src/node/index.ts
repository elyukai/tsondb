import { on } from "@elyukai/utils/function"
import { Lazy } from "@elyukai/utils/lazy"
import { compareNumber, reduceCompare } from "@elyukai/utils/ordering"
import { isError } from "@elyukai/utils/result"
import Debug from "debug"
import { mkdir, writeFile } from "node:fs/promises"
import { join, sep } from "node:path"
import { stderr } from "node:process"
import { styleText } from "node:util"
import { simpleGit, type SimpleGit, type StatusResult } from "simple-git"
import type { Output } from "../shared/output.ts"
import type {
  InstanceContainer,
  InstanceContainerOverview,
  InstanceContent,
} from "../shared/utils/instances.ts"
import { parallelizeErrors } from "../shared/utils/validation.ts"
import { Git } from "./git.js"
import { getDisplayName, getDisplayNameWithId } from "./schema/detached.ts"
import { type EntityDecl } from "./schema/dsl/index.ts"
import type {
  AnyChildEntityMap,
  AnyEntityMap,
  AnyEnumMap,
  AnyTypeAliasMap,
} from "./schema/generatedTypeHelpers.ts"
import { type IdArgsVariant } from "./schema/generatedTypeHelpers.ts"
import { isEntityDeclWithParentReference } from "./schema/guards.ts"
import type { Schema } from "./schema/index.ts"
import { serializeNode } from "./schema/treeOperations/serialization.ts"
import {
  createReferenceValidator,
  validateDeclReferentialIntegrity,
  validateDeclStructuralIntegrity,
  type ReferenceValidator,
  type ValidationContext,
} from "./schema/treeOperations/validation.ts"
import { Transaction } from "./transaction.ts"
import { checkCustomConstraintsForAllEntities } from "./utils/customConstraints.ts"
import { DatabaseInMemory } from "./utils/databaseInMemory.ts"
import { applyStepsToDisk } from "./utils/databaseOnDisk.ts"
import {
  getAllInstanceOverviewsByEntityName,
  getDisplayNameFromEntityInstance,
  getInstanceOverview,
  getInstanceOverviewsByEntityName,
} from "./utils/displayName.ts"
import {
  countError,
  countErrors,
  getErrorMessageForDisplay,
  HTTPError,
  wrapErrorsIfAny,
} from "./utils/error.ts"
import { getFileNameForId, writeInstance } from "./utils/files.ts"
import { attachGitStatusToDatabaseInMemory } from "./utils/git.ts"
import {
  getReferencesToInstances,
  isReferencedByOtherInstances,
  type ReferencesToInstances,
} from "./utils/references.ts"
import { checkUniqueConstraintsForAllEntities } from "./utils/unique.ts"

export interface DefaultTSONDBTypes {
  entityMap: AnyEntityMap
  childEntityMap: AnyChildEntityMap
  enumMap: AnyEnumMap
  typeAliasMap: AnyTypeAliasMap
}

export type Entity<T extends DefaultTSONDBTypes, E extends EntityName<T>> = T["entityMap"][E]

export type EntityName<T extends DefaultTSONDBTypes> = Extract<keyof T["entityMap"], string>

export type EnumName<T extends DefaultTSONDBTypes> = Extract<keyof T["enumMap"], string>

export type TypeAliasName<T extends DefaultTSONDBTypes> = Extract<keyof T["typeAliasMap"], string>

export type DeclarationName<T extends DefaultTSONDBTypes> =
  | EntityName<T>
  | EnumName<T>
  | TypeAliasName<T>

export type ChildEntity<
  T extends DefaultTSONDBTypes,
  E extends ChildEntityName<T>,
> = T["childEntityMap"][E][0]

export type ChildEntityConfig<
  T extends DefaultTSONDBTypes,
  E extends ChildEntityName<T>,
> = T["childEntityMap"][E]

export type ChildEntityName<T extends DefaultTSONDBTypes> = Extract<
  keyof T["childEntityMap"],
  string
>

/**
 * Options for creating a TSONDB instance.
 */
export interface TSONDBOptions<T extends DefaultTSONDBTypes = DefaultTSONDBTypes> {
  /**
   * The schema to use for the database.
   */
  schema: Schema<T>
  /**
   * The root path where the database files are stored.
   */
  dataRootPath: string
  /**
   * The locale(s) to use for displaying instances in error messages.
   *
   * If the schema does not contain a locale entity, this option must not be provided.
   */
  locales?: string[]
  /**
   * Options for validating the data in the database.
   */
  validationOptions?: Partial<ValidationOptions>
}

/**
 * Options for validating the data in the database.
 */
export interface ValidationOptions {
  /**
   * If set to `true`, referential integrity will be checked during validation.
   */
  checkReferentialIntegrity: boolean
  /**
   * If set, only the specified entities will be checked during validation.
   */
  checkOnlyEntities: string[]
  /**
   * If set, translations will be validated according to the provided options.
   */
  checkTranslations?: TranslationValidationOptions
}

/**
 * Options for validating translations in the database.
 */
export interface TranslationValidationOptions {
  /**
   * The format of the translation strings.
   *
   * Currently, only "mf2" (MessageFormat 2) is supported.
   */
  format: "mf2"

  /**
   * If set to `true`, translation keys will be treated as message format strings and their parameters must match the ones in the values.
   */
  matchParametersInKeys?: boolean
}

const debug = Debug("tsondb:class")

const prepareFolders = async (dataRootPath: string, entities: EntityDecl[]) => {
  await mkdir(dataRootPath, { recursive: true })

  for (const entity of entities) {
    const entityDir = join(dataRootPath, entity.name)
    await mkdir(entityDir, { recursive: true })
  }
}

const generateOutputs = async <T extends DefaultTSONDBTypes>(
  schema: Schema<T>,
  outputs: Output[],
): Promise<void> => {
  for (const output of outputs) {
    await output.run(schema)
  }
}

const getGit = async (dataRootPath: string) => {
  const git = simpleGit({ baseDir: dataRootPath })
  if (await git.checkIsRepo()) {
    try {
      const root = await git.revparse(["--show-toplevel"])
      const status = await git.status()
      return { git, root, status }
    } catch {
      return { git }
    }
  } else {
    return { git }
  }
}

const initData = async <T extends DefaultTSONDBTypes>(
  dataRootPath: string,
  schema: Schema<T>,
  locales: string[],
  git: TSONDBGit | undefined,
  gitStatus: StatusResult | undefined,
  skipReferenceCache: boolean,
): Promise<{
  data: DatabaseInMemory<T["entityMap"]>
  referencesToInstances: ReferencesToInstances
}> => {
  debug("loading database into memory ...")
  let data = await DatabaseInMemory.load<T["entityMap"]>(dataRootPath, schema.entities)
  debug("done")

  const localeEntity = schema.localeEntity
  if (
    localeEntity &&
    !locales.every(locale => data.hasInstanceOfEntityById(localeEntity.name, locale))
  ) {
    throw new Error("All provided locales must exist in the database.")
  }

  const serializedDeclarationsByName = Object.fromEntries(
    schema.resolvedDeclarations.map(decl => [decl.name, serializeNode(decl)]),
  )

  let referencesToInstances: ReferencesToInstances
  if (!skipReferenceCache) {
    debug("creating references cache ...")
    referencesToInstances = await getReferencesToInstances(data, serializedDeclarationsByName)
    debug("done")
  } else {
    debug("skipping references cache creation")
    referencesToInstances = {}
  }

  if (git) {
    const status = gitStatus ?? (await git.client.status())
    data = attachGitStatusToDatabaseInMemory(data, dataRootPath, git.root, status)
    debug("attached git status to instances")
  }

  return { data, referencesToInstances }
}

type TSONDBGit = { client: SimpleGit; root: string }

/**
 * The main class for managing a typed JSON database.
 */
export class TSONDB<T extends DefaultTSONDBTypes = DefaultTSONDBTypes> {
  #data: DatabaseInMemory<T["entityMap"]>
  #dataRootPath: string
  #schema: Schema<T>
  #locales: string[]
  #git: TSONDBGit | undefined
  #referencesToInstances: ReferencesToInstances
  #validationOptions: ValidationOptions
  #gitWrapper: Lazy<Git<T> | undefined>
  #locked: boolean = false

  private constructor(options: {
    dataRootPath: string
    data: DatabaseInMemory<T["entityMap"]>
    schema: Schema<T>
    locales?: string[]
    git?: TSONDBGit
    referencesToInstances: ReferencesToInstances
    validationOptions: ValidationOptions
  }) {
    this.#dataRootPath = options.dataRootPath
    this.#data = options.data
    this.#schema = options.schema
    this.#locales = options.locales ?? []
    this.#git = options.git
    this.#referencesToInstances = options.referencesToInstances
    this.#validationOptions = options.validationOptions
    this.#gitWrapper = Lazy.of(() =>
      this.#git
        ? new Git<T>(
            this,
            this.#git.client,
            this.#git.root,
            this.#dataRootPath,
            () => this.#data,
            (data: DatabaseInMemory<T["entityMap"]>) => {
              this.#data = data
            },
          )
        : undefined,
    )
  }

  /**
   * Creates a new TSONDB instance with the specified options.
   *
   * @param options The options for creating the TSONDB instance.
   * @param skipReferenceCache If set to `true`, the reference cache will not be created during initialization. This can speed up the initialization process, but referential integrity checks will not work correctly until the cache is created. This should only be set to `true` if you plan to call `sync()` immediately after initialization.
   */
  static async create<Types extends DefaultTSONDBTypes = DefaultTSONDBTypes>(
    options: TSONDBOptions<Types>,
    skipReferenceCache = false,
  ): Promise<TSONDB<Types>> {
    const entities = options.schema.entities

    debug("using data root path: %s", options.dataRootPath)
    await prepareFolders(options.dataRootPath, entities)
    debug("prepared folders")

    const { git: gitClient, root: gitRoot, status: gitStatus } = await getGit(options.dataRootPath)

    if (gitRoot) {
      debug("found git repository at: %s", gitRoot)
    } else {
      debug("no git repository found")
    }

    const localeEntity = options.schema.localeEntity

    if (!localeEntity && options.locales) {
      throw new Error("Schema does not contain a locale entity, locales cannot be provided.")
    }

    const git = gitRoot ? { client: gitClient, root: gitRoot } : undefined

    const { data, referencesToInstances } = await initData(
      options.dataRootPath,
      options.schema,
      options.locales ?? [],
      git,
      gitStatus,
      skipReferenceCache,
    )

    return new TSONDB<Types>({
      ...options,
      data,
      referencesToInstances,
      git,
      validationOptions: {
        checkReferentialIntegrity: true,
        checkOnlyEntities: [],
        ...options.validationOptions,
      },
    })
  }

  /**
   * Generates outputs based on the provided schema and output configurations.
   */
  static async generateOutputs(options: { schema: Schema; outputs: Output[] }): Promise<void> {
    await generateOutputs(options.schema, options.outputs)
  }

  /**
   * Generates outputs based on the current schema and the provided output configurations.
   */
  async generateOutputs(outputs: Output[]): Promise<void> {
    await generateOutputs(this.#schema, outputs)
  }

  #strucurallyValidateInstance(entity: EntityDecl, instanceContent: InstanceContent): Error[] {
    const validationContext: ValidationContext = {
      validationOptions: this.#validationOptions,
      useStyling: true,
    }

    return validateDeclStructuralIntegrity(validationContext, [], entity, [], instanceContent)
  }

  #validate(
    data: DatabaseInMemory<T["entityMap"]>,
    options: {
      logToConsole?: boolean
      skipStructuralValidation?: boolean
      changedEntities?: Extract<keyof T["entityMap"], string>[]
    } = {},
  ): Error[] {
    const { checkReferentialIntegrity, checkOnlyEntities } = this.#validationOptions
    const {
      skipStructuralValidation = false,
      logToConsole = true,
      changedEntities: changedEntityNames,
    } = options
    const entities = this.#schema.entities
    const getEntity = this.#schema.getEntity.bind(this.#schema)

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

    const validationContext: ValidationContext = {
      validationOptions: this.#validationOptions,
      useStyling: true,
    }

    const errors: Error[] = []

    if (!skipStructuralValidation) {
      debug("Checking structural integrity ...")

      const structureErrors = onlyEntities
        .flatMap(entity =>
          parallelizeErrors(
            data
              .getAllInstanceContainersOfEntity(entity.name)
              .map(instance =>
                wrapErrorsIfAny(
                  `in file ${styleText("white", `"${this.#dataRootPath}${sep}${styleText("bold", join(entity.name, getFileNameForId(instance.id)))}"`)}`,
                  validateDeclStructuralIntegrity(
                    validationContext,
                    [],
                    entity,
                    [],
                    instance.content,
                  ),
                ),
              ),
          ),
        )
        .toSorted((a, b) => a.message.localeCompare(b.message))

      if (structureErrors.length > 0) {
        const errorCount = countErrors(structureErrors)
        debug(
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

          const referenceValidator: ReferenceValidator = createReferenceValidator(
            this.#schema.isEntityName.bind(this.#schema),
            data,
            true,
          )

          const referenceErrors = onlyEntities
            .flatMap(entity =>
              parallelizeErrors(
                data
                  .getAllInstanceContainersOfEntity(entity.name)
                  .map(instance =>
                    wrapErrorsIfAny(
                      `in file ${styleText("white", `"${this.#dataRootPath}${sep}${styleText("bold", join(entity.name, getFileNameForId(instance.id)))}"`)}`,
                      validateDeclReferentialIntegrity(
                        validationContext,
                        referenceValidator,
                        [],
                        entity,
                        [],
                        instance.content,
                      ),
                    ),
                  ),
              ),
            )
            .toSorted((a, b) => a.message.localeCompare(b.message))

          if (referenceErrors.length > 0) {
            const errorCount = countErrors(referenceErrors)
            debug(
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
        this.#locales,
      )

      const uniqueConstraintResult = checkUniqueConstraintsForAllEntities(
        data,
        changedEntities ?? onlyEntities,
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
        (...args) => getDisplayName(getEntity, this.#locales, data, ...args),
        (...args) => getDisplayNameWithId(getEntity, this.#locales, data, ...args),
        (...args) =>
          getInstanceOverview(
            data.getInstanceContainerOfEntityById.bind(data),
            data.getAllChildInstanceContainersForParent.bind(data, getEntity),
            getEntity,
            this.#locales,
            args,
          ),
        getEntity,
        data,
        entities,
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
      debug("Skipping further checks due to previous structural integrity errors")
    }

    if (logToConsole) {
      console.log(`${data.totalSize.toString()} instance${data.totalSize === 1 ? "" : "s"} checked`)

      if (errors.length === 0) {
        console.log(styleText("green", "All instances are valid"))
      } else {
        const errorCount = countErrors(errors)
        console.error(
          styleText(
            "red",
            `${errorCount.toString()} validation error${errorCount === 1 ? "" : "s"} found\n\n${errors.map(err => getErrorMessageForDisplay(err)).join("\n\n")}`,
            { stream: stderr },
          ),
        )
      }
    }

    return errors
  }

  /**
   * Validates the data in the database.
   *
   * Returns `true` if the data is valid, `false` otherwise.
   */
  validate(): boolean {
    debug("Validating database ...")
    return this.#validate(this.#data).length === 0
  }

  /**
   * Formats the data on disk according to the current in-memory representation.
   */
  async format(): Promise<void> {
    debug("Formatting database ...")
    await this.#data.forEachInstance(async (entityName, instance) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entity = this.#schema.getEntity(entityName)!
      await writeInstance(this.#dataRootPath, entity, instance.id, instance.content)
    }, true)
    debug("All data is formatted")
  }

  /**
   * Reloads the data from disk into memory.
   */
  async sync(): Promise<void> {
    debug("Syncing with disk ...")
    const { data, referencesToInstances } = await initData(
      this.#dataRootPath,
      this.#schema,
      this.#locales,
      this.#git,
      undefined,
      false,
    )

    this.#data = data
    this.#referencesToInstances = referencesToInstances
    debug("Synced with disk")
  }

  /**
   * Runs a transaction on the database.
   *
   * The provided function is called with a `Transaction` object, which can be used to create, update, or delete instances. If an error is thrown during the execution of the function, the transaction is rolled back and no changes are made to the database.
   * @throws {Error} when the transaction could not be completed
   */
  async runTransaction<R>(
    fn: (transaction: Transaction<T["entityMap"]>) => [Transaction<T["entityMap"]>, R],
  ): Promise<R> {
    if (this.#locked) {
      debug("Another transaction is currently running")
      throw new HTTPError(
        503,
        "Another transaction is currently running. Transactions cannot be run concurrently.",
      )
    }

    debug("Starting transaction, locking database ...")
    this.#locked = true

    try {
      const getEntity = this.#schema.getEntity.bind(this.#schema)
      const [txn, res] = fn(
        new Transaction({
          data: this.#data,
          getEntity,
          referencesToInstances: this.#referencesToInstances,
          validate: this.#strucurallyValidateInstance.bind(this),
          localeEntity: this.#schema.localeEntity,
          steps: [],
        }),
      )

      const txtResult = txn.getResult()

      const { data: newData, referencesToInstances: newRefs, steps } = txtResult

      const changedEntities = [...new Set(steps.map(step => step.entity.name))] as Extract<
        keyof T["entityMap"],
        string
      >[]

      const errors = this.#validate(newData, {
        logToConsole: false,
        skipStructuralValidation: true,
        changedEntities,
      })

      if (errors.length > 0) {
        debug(
          "Transaction validation failed with %d error%s",
          errors.length,
          errors.length === 1 ? "" : "s",
        )
        throw new AggregateError(errors, "Validation errors occurred")
      }

      debug("Applying changes to disk ...")
      const diskResult = await applyStepsToDisk(this.#dataRootPath, steps)

      if (isError(diskResult)) {
        debug("Error applying changes to disk: %s", diskResult.error.message)
        throw diskResult.error
      } else {
        debug("Changes applied to disk successfully")
      }

      if (this.#git) {
        debug("Updating git status ...")
        const status = await this.#git.client.status()
        const newDbWithUpdatedGit = attachGitStatusToDatabaseInMemory(
          newData,
          this.#dataRootPath,
          this.#git.root,
          status,
        )
        debug("Git status updated")

        this.#data = newDbWithUpdatedGit
      } else {
        debug("No git repository, skipping git status update")
        this.#data = newData
      }

      this.#referencesToInstances = newRefs

      this.#locked = false
      debug("Transaction successful, released lock")
      return res
    } catch (error) {
      this.#locked = false
      throw error
    }
  }

  /**
   * Creates a new instance in the database.
   *
   * If the instance is of the locale entity, a locale identifier must be provided as `id`.
   * @throws {Error} when the instance could not be created
   */
  async createInstance<E extends EntityName<T>>(
    entityName: E,
    content: Entity<T, E>,
    id?: string,
  ): Promise<InstanceContainer<Entity<T, E>>> {
    const res = await this.runTransaction(txn =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      txn.createInstance(this.#schema.getEntity(entityName)!, content, id),
    )

    return res as InstanceContainer<Entity<T, E>>
  }

  /**
   * Updates an instance in the database.
   *
   * @throws {Error} when the instance could not be updated
   */
  async updateInstance<E extends EntityName<T>>(
    entityName: E,
    id: string,
    content: Entity<T, E>,
  ): Promise<InstanceContainer<Entity<T, E>>> {
    const res = await this.runTransaction(txn =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      txn.updateInstance(this.#schema.getEntity(entityName)!, id, content),
    )

    return res as InstanceContainer<Entity<T, E>>
  }

  /**
   * Deletes an instance in the database.
   *
   * @throws {Error} when the instance could not be deleted
   */
  async deleteInstance<E extends EntityName<T>>(entityName: E, id: string): Promise<Entity<T, E>> {
    const res = await this.runTransaction(txn =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      txn.deleteInstance(this.#schema.getEntity(entityName)!, id),
    )

    return res.content as Entity<T, E>
  }

  /**
   * Retrieves an instance of the specified entity by its identifier.
   */
  getInstanceOfEntityById<E extends EntityName<T>>(
    ...args: IdArgsVariant<T["entityMap"], E>
  ): T["entityMap"][E] | undefined {
    return this.#data.getInstanceContainerOfEntityById(...args)?.content
  }

  /**
   * Retrieves the instance container of the specified entity by its identifier.
   */
  getInstanceContainerOfEntityById<E extends EntityName<T>>(
    ...args: IdArgsVariant<T["entityMap"], E>
  ): InstanceContainer<T["entityMap"][E]> | undefined {
    return this.#data.getInstanceContainerOfEntityById(...args)
  }

  /**
   * Retrieves the overview of an instance of the specified entity by its identifier.
   */
  getInstanceOverviewOfEntityById(
    ...args: IdArgsVariant<T["entityMap"]>
  ): InstanceContainerOverview | undefined {
    return getInstanceOverview(
      this.getInstanceContainerOfEntityById.bind(this),
      this.getAllChildInstanceContainersForParent.bind(this),
      this.#schema.getEntity.bind(this.#schema),
      this.#locales,
      args,
    )
  }

  /**
   * Retrieves all instances of the specified entity.
   */
  getAllInstancesOfEntity<E extends EntityName<T>>(entityName: E): Entity<T, E>[] {
    return this.#data.getAllInstanceContainersOfEntity(entityName).map(ic => ic.content)
  }

  /**
   * Retrieves all instance containers of the specified entity.
   */
  getAllInstanceContainersOfEntity<E extends EntityName<T>>(
    entityName: E,
  ): InstanceContainer<Entity<T, E>>[] {
    return this.#data.getAllInstanceContainersOfEntity(entityName)
  }

  /**
   * Retrieves all instance overviews of the specified entity.
   */
  getAllInstanceOverviewsOfEntity(
    entity: EntityDecl<EntityName<T>> | EntityName<T>,
  ): InstanceContainerOverview[] {
    const normEntity = typeof entity === "object" ? entity : this.#schema.getEntity(entity)

    if (!normEntity) {
      return []
    }

    return getInstanceOverviewsByEntityName<T["entityMap"], T["childEntityMap"]>(
      this.getInstanceContainerOfEntityById.bind(this),
      this.getAllChildInstanceContainersForParent.bind(this),
      this.#schema.getEntity.bind(this.#schema),
      normEntity,
      this.getAllInstanceContainersOfEntity(normEntity.name),
      this.#locales,
    )
  }

  /**
   * Counts the number of instances registered for the specified entity.
   */
  countInstancesOfEntity(entityName: EntityName<T>): number {
    return this.#data.countInstancesOfEntity(entityName)
  }

  /**
   * Retrieves overviews for all instances in the database, grouped by entity name.
   */
  getAllInstanceOverviews(): Record<EntityName<T>, InstanceContainerOverview[]> {
    return getAllInstanceOverviewsByEntityName(
      this.#schema.getEntity.bind(this.#schema),
      this.#data,
      this.#locales,
    )
  }

  /**
   * Retrieves all instance containers of the specified child entity for a given parent instance.
   */
  getAllChildInstanceContainersForParent<U extends ChildEntityName<T>>(
    childEntityName: U,
    parentId: ChildEntityConfig<T, U>[2],
  ): InstanceContainer<ChildEntity<T, U>>[] {
    return this.#data.getAllChildInstanceContainersForParent(
      this.#schema.getEntity.bind(this.#schema),
      childEntityName,
      parentId,
    )
  }

  /**
   * Displays the name of an entity instance including its ID. If no display name is found, `undefined` is returned.
   */
  getDisplayName(...args: IdArgsVariant<T["entityMap"]>): string | undefined {
    return getDisplayName(
      this.#schema.getEntity.bind(this.#schema),
      this.#locales,
      this.#data,
      ...args,
    )
  }

  /**
   * Displays the name of an entity instance including its ID. If no display name is found, only the ID is returned.
   */
  getDisplayNameWithId(...args: IdArgsVariant<T["entityMap"]>): string {
    return getDisplayNameWithId(
      this.#schema.getEntity.bind(this.#schema),
      this.#locales,
      this.#data,
      ...args,
    )
  }

  /**
   * Checks if a given instance is referenced by other instances in the database.
   *
   * If `otherInstancesToDelete` is provided, those instances will be excluded from the check. This can be useful when planning to delete multiple instances at once and wanting to ignore references from those instances.
   */
  isReferencedByOtherInstances(instance: string, otherInstancesToDelete?: string[]): boolean {
    return isReferencedByOtherInstances(
      this.#referencesToInstances,
      instance,
      otherInstancesToDelete,
    )
  }

  /**
   * The configured locales for this TSONDB instance.
   */
  get locales(): string[] {
    return this.#locales
  }

  /**
   * The loaded schema for this TSONDB instance.
   */
  get schema(): Schema<T> {
    return this.#schema
  }

  /**
   * The Git wrapper for this TSONDB instance, if a git repository is connected.
   */
  get git(): Git<T> | undefined {
    return this.#gitWrapper.value
  }

  /**
   * Checks if the current TSONDB instance is connected to a git repository.
   */
  isGitRepo(): this is TSONDBWithGit<T> {
    return this.#git !== undefined
  }

  /**
   * Searches for instances matching the provided query in their ID or display name.
   *
   * The results are sorted by relevance. A custom relevance score function can be provided.
   */
  search(
    query: string,
    options: Partial<{
      getRelevanceScore: <E extends EntityName<T>>(args: {
        entityName: E
        id: string
        content: Entity<T, E>
        displayName: string
        displayNameLocaleId: string | undefined
        query: string
        queryLowerCase: string
      }) => number
    }> = {},
  ): [string, InstanceContainerOverview][] {
    if (!query || query.trim().length === 0) {
      return []
    }

    const {
      getRelevanceScore = ({ id, displayName }) => {
        const searchableName = displayName.toLowerCase()
        return id.startsWith(query) || searchableName.startsWith(lowerCaseQuery)
          ? 1
          : id.includes(query) || searchableName.includes(lowerCaseQuery)
            ? 0.5
            : 0
      },
    } = options

    const lowerCaseQuery = query.toLowerCase()

    return this.#data
      .getAllInstances()
      .flatMap(([entityName, instances]) => {
        const entity = this.#schema.getEntity(entityName)

        if (entity && isEntityDeclWithParentReference(entity)) {
          return []
        }

        return instances
          .map((instance): [string, InstanceContainerOverview & { relevance: number }] => {
            const { name, localeId } = getDisplayNameFromEntityInstance(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              entity!,
              instance,
              this.#schema.getEntity.bind(this.#schema),
              this.getInstanceContainerOfEntityById.bind(this),
              this.getAllChildInstanceContainersForParent.bind(this),
              this.#locales,
            )

            return [
              entityName,
              {
                id: instance.id,
                displayName: name,
                displayNameLocaleId: localeId,
                relevance: getRelevanceScore({
                  entityName,
                  id: instance.id,
                  content: instance.content as Entity<T, EntityName<T>>,
                  displayName: name,
                  displayNameLocaleId: localeId,
                  query,
                  queryLowerCase: lowerCaseQuery,
                }),
              },
            ]
          })
          .filter(instance => instance[1].relevance > 0)
      })
      .toSorted(
        reduceCompare(
          on(item => item[1].relevance, compareNumber),
          (a, b) => a[1].displayName.localeCompare(b[1].displayName, a[1].displayNameLocaleId),
        ),
      )
  }

  /**
   * Retrieves the name of the entity for a given instance ID. If no instance with the provided ID is found, `undefined` is returned.
   */
  getEntityNameOfInstanceId(id: string): string | undefined {
    return this.#data.getEntityNameOfInstanceId(id)
  }

  /**
   * Compresses the entire database into a single JSON file at the specified path.
   *
   * Instead of storing each instance in its own file, this method serializes the entire database into a single JSON file. This can be useful for backup, transfer or archiving purposes. The resulting file contains all instances organized by entity names. No spaces or indentation are used in the JSON output to minimize file size.
   * @param path The file path where the compressed database will be saved.
   */
  async compressToSingleFile(path: string): Promise<void> {
    await writeFile(path, JSON.stringify(this.#data), "utf-8")
  }
}

export type TSONDBWithGit<T extends DefaultTSONDBTypes = DefaultTSONDBTypes> = TSONDB<T> & {
  git: Git<T>
}
