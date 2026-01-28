import { deepEqual } from "@elyukai/utils/equality"
import { Lazy } from "@elyukai/utils/lazy"
import { isError } from "@elyukai/utils/result"
import Debug from "debug"
import { mkdir } from "node:fs/promises"
import { join, sep } from "node:path"
import { stderr } from "node:process"
import { styleText } from "node:util"
import { simpleGit, type SimpleGit, type StatusResult } from "simple-git"
import type { Output } from "../shared/output.ts"
import type { InstanceContainer, InstanceContainerOverview } from "../shared/utils/instances.ts"
import { parallelizeErrors } from "../shared/utils/validation.ts"
import { Git } from "./git.js"
import type {
  AnyChildEntityMap,
  AnyEntityMap,
  AnyEnumMap,
  AnyTypeAliasMap,
} from "./schema/externalTypes.ts"
import { normalizedIdArgs, type IdArgsVariant } from "./schema/helpers.ts"
import {
  createValidationContext,
  isEntityDeclWithParentReference,
  serializeNode,
  validateEntityDecl,
  type EntityDecl,
} from "./schema/index.ts"
import type { Schema } from "./schema/Schema.ts"
import { Transaction } from "./transaction.js"
import { checkCustomConstraintsForAllEntities } from "./utils/customConstraints.ts"
import {
  asyncForEachInstanceInDatabaseInMemory,
  countInstancesInDatabaseInMemory,
  countInstancesOfEntityInDatabaseInMemory,
  createDatabaseInMemory,
  getGroupedInstancesFromDatabaseInMemory,
  getInstanceOfEntityFromDatabaseInMemory,
  getInstancesOfEntityFromDatabaseInMemory,
  hasInstanceOfEntityFromDatabaseInMemory,
  type DatabaseInMemory,
} from "./utils/databaseInMemory.ts"
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
      const root = await git.revparse({ "--show-toplevel": null })
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
  gitStatus?: StatusResult,
): Promise<{
  data: DatabaseInMemory<T["entityMap"]>
  referencesToInstances: ReferencesToInstances
}> => {
  debug("loading database into memory ...")
  let data = await createDatabaseInMemory<T["entityMap"]>(dataRootPath, schema.entities)
  debug("done")

  const localeEntity = schema.localeEntity
  if (
    localeEntity &&
    !locales.every(locale =>
      hasInstanceOfEntityFromDatabaseInMemory(data, localeEntity.name, locale),
    )
  ) {
    throw new Error("All provided locales must exist in the database.")
  }

  const serializedDeclarationsByName = Object.fromEntries(
    schema.resolvedDeclarations.map(decl => [decl.name, serializeNode(decl)]),
  )

  debug("creating references cache ...")
  const referencesToInstances = await getReferencesToInstances(data, serializedDeclarationsByName)
  debug("done")

  if (git) {
    const status = gitStatus ?? (await git.client.status())
    data = attachGitStatusToDatabaseInMemory(data, dataRootPath, git.root, status)
    debug("attached git status to instances")
  }

  return { data, referencesToInstances }
}

type TSONDBGit = { client: SimpleGit; root: string }

export class TSONDB<T extends DefaultTSONDBTypes = DefaultTSONDBTypes> {
  #data: DatabaseInMemory<T["entityMap"]>
  #dataRootPath: string
  #schema: Schema<T>
  #locales: string[]
  #git: TSONDBGit | undefined
  #referencesToInstances: ReferencesToInstances
  #validationOptions: ValidationOptions
  #gitWrapper: Lazy<Git<T> | undefined>

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
   */
  static async create<Types extends DefaultTSONDBTypes = DefaultTSONDBTypes>(
    options: TSONDBOptions<Types>,
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

  static async generateOutputs(options: { schema: Schema; outputs: Output[] }): Promise<void> {
    await generateOutputs(options.schema, options.outputs)
  }

  async generateOutputs(outputs: Output[]): Promise<void> {
    await generateOutputs(this.#schema, outputs)
  }

  /**
   * Validates the data in the database.
   *
   * Returns `true` if the data is valid, `false` otherwise.
   */
  validate(): boolean {
    const { checkReferentialIntegrity, checkOnlyEntities } = this.#validationOptions
    const entities = this.#schema.entities

    for (const onlyEntity of checkOnlyEntities) {
      if (!entities.find(entity => entity.name === onlyEntity)) {
        throw new Error(`Entity "${onlyEntity}" not found in schema`)
      }
    }

    const validationContext = createValidationContext(
      this.#validationOptions,
      this.#data,
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
          getInstancesOfEntityFromDatabaseInMemory(this.#data, entity.name).map(instance =>
            wrapErrorsIfAny(
              `in file ${styleText("white", `"${this.#dataRootPath}${sep}${styleText("bold", join(entity.name, getFileNameForId(instance.id)))}"`)}`,
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

      const instanceOverviewsByEntityName = this.getAllInstanceOverviews()

      const uniqueConstraintResult = checkUniqueConstraintsForAllEntities(
        this.#data,
        this.#schema.entities,
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

      const customConstraintResult = checkCustomConstraintsForAllEntities(this)

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

    const totalInstanceCount = countInstancesInDatabaseInMemory(this.#data)
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
      return false
    }
  }

  /**
   * Formats the data on disk according to the current in-memory representation.
   */
  async format(): Promise<void> {
    await asyncForEachInstanceInDatabaseInMemory(this.#data, async (entityName, instance) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entity = this.#schema.getEntity(entityName)!
      await writeInstance(this.#dataRootPath, entity, instance.id, instance.content)
    })
  }

  /**
   * Reloads the data from disk into memory.
   */
  async sync(): Promise<void> {
    const { data, referencesToInstances } = await initData(
      this.#dataRootPath,
      this.#schema,
      this.#locales,
      this.#git,
    )

    this.#data = data
    this.#referencesToInstances = referencesToInstances
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
    const getEntity = this.#schema.getEntity.bind(this.#schema)
    const [txn, res] = fn(
      new Transaction({
        data: this.#data,
        getEntity,
        referencesToInstances: this.#referencesToInstances,
        validationOptions: this.#validationOptions,
        localeEntity: this.#schema.localeEntity,
        steps: [],
      }),
    )

    const txtResult = txn.getResult()

    const { data: newData, referencesToInstances: newRefs, steps } = txtResult

    const instanceOverviewsByEntityName = getAllInstanceOverviewsByEntityName(
      this.getInstanceContainerOfEntityById.bind(this),
      this.getAllChildInstanceContainersForParent.bind(this),
      getEntity,
      newData,
      this.#locales,
    )

    const uniqueConstraintResult = checkUniqueConstraintsForAllEntities(
      newData,
      this.#schema.entities,
      instanceOverviewsByEntityName,
    )

    if (isError(uniqueConstraintResult)) {
      throw uniqueConstraintResult.error
    }

    const customConstraintResult = checkCustomConstraintsForAllEntities(this)

    if (isError(customConstraintResult)) {
      throw customConstraintResult.error
    }

    const diskResult = await applyStepsToDisk(this.#dataRootPath, steps)

    if (isError(diskResult)) {
      throw diskResult.error
    }

    if (this.#git) {
      const status = await this.#git.client.status()
      const repoRoot = await this.#git.client.revparse(["--show-toplevel"])
      const newDbWithUpdatedGit = attachGitStatusToDatabaseInMemory(
        newData,
        this.#dataRootPath,
        repoRoot,
        status,
      )

      this.#data = newDbWithUpdatedGit
    } else {
      this.#data = newData
    }

    this.#referencesToInstances = newRefs

    return res
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

  getInstanceOfEntityById<E extends EntityName<T>>(
    ...args: IdArgsVariant<T["entityMap"], E>
  ): T["entityMap"][E] | undefined {
    return this.getInstanceContainerOfEntityById(...args)?.content
  }

  getInstanceContainerOfEntityById<E extends EntityName<T>>(
    ...args: IdArgsVariant<T["entityMap"], E>
  ): InstanceContainer<T["entityMap"][E]> | undefined {
    const { entityName, id } = normalizedIdArgs(args)
    return getInstanceOfEntityFromDatabaseInMemory(this.#data, entityName, id) as
      | InstanceContainer<T["entityMap"][E]>
      | undefined
  }

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

  getAllInstancesOfEntity<E extends EntityName<T>>(entityName: E): Entity<T, E>[] {
    return this.getAllInstanceContainersOfEntity(entityName).map(ic => ic.content)
  }

  getAllInstanceContainersOfEntity<E extends EntityName<T>>(
    entityName: E,
  ): InstanceContainer<Entity<T, E>>[] {
    return getInstancesOfEntityFromDatabaseInMemory(this.#data, entityName) as InstanceContainer<
      Entity<T, E>
    >[]
  }

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

  countInstancesOfEntity(entityName: EntityName<T>): number {
    return countInstancesOfEntityInDatabaseInMemory(this.#data, entityName)
  }

  getAllInstanceOverviews(): Record<EntityName<T>, InstanceContainerOverview[]> {
    return getAllInstanceOverviewsByEntityName(
      this.getInstanceContainerOfEntityById.bind(this),
      this.getAllChildInstanceContainersForParent.bind(this),
      this.#schema.getEntity.bind(this.#schema),
      this.#data,
      this.#locales,
    )
  }

  getAllChildInstanceContainersForParent<U extends ChildEntityName<T>>(
    childEntityName: U,
    parentId: ChildEntityConfig<T, U>[2],
  ): InstanceContainer<ChildEntity<T, U>>[] {
    const entity = this.#schema.getEntity(childEntityName as EntityName<T>)
    if (!entity || !entity.parentReferenceKey) {
      return []
    }
    const parentKey = entity.parentReferenceKey

    return getInstancesOfEntityFromDatabaseInMemory(
      this.#data,
      childEntityName as EntityName<T>,
    ).filter(instance =>
      deepEqual((instance.content as { [K in typeof parentKey]: unknown })[parentKey], parentId),
    )
  }

  /**
   * Displays the name of an entity instance including its ID. If no display name is found, `undefined` is returned.
   */
  getDisplayName(...args: IdArgsVariant<T["entityMap"]>): string | undefined {
    const { entityName, id } = normalizedIdArgs(args)
    // return instanceOverviewsByEntityName[entityName]?.find(o => o.id === id)?.displayName
    const entity = this.#schema.getEntity(entityName)
    if (!entity) {
      return undefined
    }
    const instance = getInstanceOfEntityFromDatabaseInMemory(this.#data, entity.name, id)
    if (!instance) {
      return undefined
    }
    return getDisplayNameFromEntityInstance<T["entityMap"], T["childEntityMap"]>(
      entity,
      instance,
      this.#schema.getEntity.bind(this.#schema),
      this.getInstanceContainerOfEntityById.bind(this),
      this.getAllChildInstanceContainersForParent.bind(this),
      this.#locales,
    ).name
  }

  /**
   * Displays the name of an entity instance including its ID. If no display name is found, only the ID is returned.
   */
  getDisplayNameWithId(...args: IdArgsVariant<T["entityMap"]>): string {
    const { id } = normalizedIdArgs(args)
    const displayName = this.getDisplayName(...args)
    return displayName ? `"${displayName}" (${id})` : id
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

    return getGroupedInstancesFromDatabaseInMemory(this.#data)
      .flatMap(([entityName, instances]) => {
        const entity = this.#schema.getEntity(entityName)

        if (entity && isEntityDeclWithParentReference(entity)) {
          return []
        }

        return instances.map(
          (instance): [string, InstanceContainerOverview & { relevance: number }] => {
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
          },
        )
      })
      .toSorted(
        (a, b) =>
          a[1].relevance - b[1].relevance ||
          a[1].displayName.localeCompare(b[1].displayName, a[1].displayNameLocaleId),
      )
  }
}

export type TSONDBWithGit<T extends DefaultTSONDBTypes = DefaultTSONDBTypes> = TSONDB<T> & {
  git: Git<T>
}
