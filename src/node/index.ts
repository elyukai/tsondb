import { Lazy } from "@elyukai/utils/lazy"
import { isError } from "@elyukai/utils/result"
import Debug from "debug"
import { writeFile } from "node:fs/promises"
import semver from "semver"
import { simpleGit } from "simple-git"
import { HTTPError } from "../shared/utils/error.ts"
import type {
  InstanceContainer,
  InstanceContent,
  SingletonInstanceContainer,
} from "../shared/utils/instances.ts"
import type { FormatterOptions, ServerOptions } from "./config.ts"
import { Git } from "./git.js"
import { ReadonlyTSONDB } from "./readonly.ts"
import type { EntityDecl, SingletonEntityDecl } from "./schema/dsl/index.ts"
import type {
  AnyChildEntityMap,
  AnyEntityMap,
  AnyEnumMap,
  AnySingletonEntityMap,
  AnyTypeAliasMap,
} from "./schema/generatedTypeHelpers.ts"
import type { Schema } from "./schema/index.ts"
import {
  validateDeclStructuralIntegrity,
  type ValidationContext,
} from "./schema/treeOperations/validation.ts"
import { createServer } from "./server/index.ts"
import {
  createCompressedDatabaseFile,
  getTSONDBVersion,
  initData,
  prepareFolders,
  validate,
  writeMetaFile,
  type TSONDBGit,
} from "./shared.ts"
import { Transaction } from "./transaction.ts"
import { DatabaseInMemory } from "./utils/databaseInMemory.ts"
import { applyStepsToDisk } from "./utils/databaseOnDisk.ts"
import { writeInstance, writeSingletonInstance } from "./utils/files.ts"
import { attachGitStatusToDatabaseInMemory } from "./utils/git.ts"
import type { ReferencesToInstances } from "./utils/references.ts"

export interface DefaultTSONDBTypes {
  entityMap: AnyEntityMap
  singletonEntityMap: AnySingletonEntityMap
  childEntityMap: AnyChildEntityMap
  enumMap: AnyEnumMap
  typeAliasMap: AnyTypeAliasMap
}

export type Entity<
  T extends DefaultTSONDBTypes,
  E extends EntityName<T> = EntityName<T>,
> = T["entityMap"][E]

export type EntityName<T extends DefaultTSONDBTypes> = Extract<keyof T["entityMap"], string>

export type SingletonEntity<
  T extends DefaultTSONDBTypes,
  E extends SingletonEntityName<T>,
> = T["singletonEntityMap"][E]

export type SingletonEntityName<T extends DefaultTSONDBTypes> = Extract<
  keyof T["singletonEntityMap"],
  string
>

export type EnumName<T extends DefaultTSONDBTypes> = Extract<keyof T["enumMap"], string>

export type TypeAliasName<T extends DefaultTSONDBTypes> = Extract<keyof T["typeAliasMap"], string>

export type StoringEntityName<T extends DefaultTSONDBTypes> = EntityName<T> | SingletonEntityName<T>

export type DeclarationName<T extends DefaultTSONDBTypes> =
  | EntityName<T>
  | SingletonEntityName<T>
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
  /**
   * Options for formatting the data in the database.
   */
  formatterOptions?: Partial<FormatterOptions>
  /**
   * If set, the database will be migrated through the specified migration stages before being used.
   */
  migrationStages?: MigrationStage<T>[]
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

  /**
   * Special options for validating Markdown content in the database.
   */
  markdown?: Partial<MarkdownValidationOptions>
}

/**
 * Special options for validating Markdown content in the database.
 */
export interface MarkdownValidationOptions {
  /**
   * Checks for the existence of referenced entities and possibly instances in attributed strings. If the attribute names are not specified via an object, the default attribute names `entity` and `instance` will be used.
   */
  checkInstanceReferencesInAttributedStrings?: boolean | { entityKey: string; instanceKey: string }

  /**
   * If set, keys in attributed strings will be checked agains the provided list of keys or regular expression. Keys for `checkInstanceReferencesInAttributedStrings` are included automatically and do not need to be specified again.
   */
  checkAttributedStringKeys?: string[] | RegExp
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

export interface MigrationStage<T extends DefaultTSONDBTypes = DefaultTSONDBTypes> {
  fromVersion: string
  toVersion: string
  willMigrate?(context: TSONDB<T>): Promise<void>
}

const debug = Debug("tsondb:main")

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

export type HookTrigger = "transaction:before" | "transaction:after"

/**
 * The main class for managing a typed JSON database.
 */
export class TSONDB<T extends DefaultTSONDBTypes = DefaultTSONDBTypes> extends ReadonlyTSONDB<T> {
  #git: TSONDBGit | undefined
  #gitWrapper: Lazy<Git<T> | undefined>
  #locked: boolean = false
  #hooks: Partial<Record<HookTrigger, ((tsondb: TSONDB<T>) => void)[]>> = {}

  private constructor(options: {
    dataRootPath: string
    data: DatabaseInMemory<T["entityMap"], T["singletonEntityMap"]>
    schema: Schema<T>
    locales?: string[]
    git?: TSONDBGit
    referencesToInstances: ReferencesToInstances
    validationOptions: ValidationOptions
    formatterOptions?: Partial<FormatterOptions> | undefined
  }) {
    super(options)
    this.#git = options.git
    this.#gitWrapper = Lazy.of(() =>
      this.#git
        ? new Git<T>(
            this,
            this.#git.client,
            this.#git.root,
            this.dataRootPath,
            () => this._data,
            (data: DatabaseInMemory<T["entityMap"], T["singletonEntityMap"]>) => {
              this._data = data
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
  static override async create<Types extends DefaultTSONDBTypes = DefaultTSONDBTypes>(
    options: TSONDBOptions<Types>,
    skipReferenceCache = false,
  ): Promise<TSONDB<Types>> {
    const { entities } = options.schema

    debug("using data root path: %s", options.dataRootPath)
    await prepareFolders(options.schema.version, options.dataRootPath, entities)
    debug("prepared folders")

    const { git: gitClient, root: gitRoot, status: gitStatus } = await getGit(options.dataRootPath)

    if (gitRoot) {
      debug("found git repository at: %s", gitRoot)
    } else {
      debug("no git repository found")
    }

    const { localeEntity } = options.schema

    if (!localeEntity && options.locales) {
      throw new Error("Schema does not contain a locale entity, locales cannot be provided.")
    }

    const git = gitRoot ? { client: gitClient, root: gitRoot } : undefined

    const { data, referencesToInstances, meta } = await initData(
      options.dataRootPath,
      options.schema,
      options.locales ?? [],
      git,
      gitStatus,
      skipReferenceCache,
      false,
    )

    const db = new TSONDB<Types>({
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

    meta.version = await getTSONDBVersion()

    if (meta.schemaVersion !== options.schema.version && options.migrationStages) {
      debug(
        "migrating database from schema version %s to %s",
        meta.schemaVersion,
        options.schema.version,
      )

      for (const stage of options.migrationStages) {
        if (
          semver.valid(stage.toVersion) === null ||
          semver.validRange(stage.fromVersion) === null
        ) {
          throw new Error(
            `Invalid semver version in migration stage from ${stage.fromVersion} to ${stage.toVersion}`,
          )
        }
      }

      for (const stage of options.migrationStages) {
        if (semver.satisfies(meta.schemaVersion, stage.fromVersion)) {
          debug("applying migration stage from %s to %s", stage.fromVersion, stage.toVersion)
          // oxlint-disable-next-line no-await-in-loop
          await stage.willMigrate?.(db)
          meta.schemaVersion = stage.toVersion
          // oxlint-disable-next-line no-await-in-loop
          await writeMetaFile(options.dataRootPath, meta)
        } else {
          debug("skipping migration stage from %s to %s", stage.fromVersion, stage.toVersion)
        }
      }
    } else {
      debug("no migration needed, schema version is up to date")
    }

    return db
  }

  #strucurallyValidateInstance(
    entity: EntityDecl | SingletonEntityDecl,
    instanceContent: InstanceContent,
  ): Error[] {
    const validationContext: ValidationContext = {
      validationOptions: this._validationOptions,
      useStyling: true,
    }

    return validateDeclStructuralIntegrity(validationContext, [], entity, [], instanceContent)
  }

  #validate(
    data: DatabaseInMemory<T["entityMap"], T["singletonEntityMap"]>,
    options?: {
      logToConsole?: boolean
      skipStructuralValidation?: boolean
      changedEntities?: Extract<keyof (T["entityMap"] & T["singletonEntityMap"]), string>[]
    },
  ): Error[] {
    return validate(
      {
        data,
        dataRootPath: this.dataRootPath,
        locales: this.locales,
        schema: this.schema,
        validationOptions: this._validationOptions,
      },
      options,
    )
  }

  /**
   * Formats the data on disk according to the current in-memory representation.
   */
  async format(): Promise<void> {
    debug("Formatting database ...")
    await this._data.forEachInstance(async (entityName, instance) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entity = this.schema.getEntity(entityName)!
      await writeInstance(
        this.dataRootPath,
        entity,
        instance.id,
        instance.content,
        this._formatterOptions,
      )
    }, true)
    await this._data.forEachSingletonInstance(async (entityName, instance) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entity = this.schema.getSingletonEntity(entityName)!
      await writeSingletonInstance(
        this.dataRootPath,
        entity,
        instance.content,
        this._formatterOptions,
      )
    }, true)
    debug("All data is formatted")
  }

  /**
   * Runs a transaction on the database.
   *
   * The provided function is called with a `Transaction` object, which can be used to create, update, or delete instances. If an error is thrown during the execution of the function, the transaction is rolled back and no changes are made to the database.
   * @throws {Error} when the transaction could not be completed
   */
  async runTransaction<R>(
    fn: (
      transaction: Transaction<T["entityMap"], T["singletonEntityMap"]>,
    ) => [Transaction<T["entityMap"], T["singletonEntityMap"]>, R],
  ): Promise<R> {
    if (this.#locked) {
      debug("Another transaction is currently running")
      throw new HTTPError(
        503,
        "Another transaction is currently running. Transactions cannot be run concurrently.",
      )
    }

    debug("Starting transaction, locking database ...")
    this.#hooks["transaction:before"]?.forEach(hook => hook(this))
    this.#locked = true

    try {
      const getEntity = this.schema.getEntity.bind(this.schema)
      const getSingletonEntity = this.schema.getSingletonEntity.bind(this.schema)

      const [txn, res] = fn(
        new Transaction({
          data: this._data,
          getEntity,
          getSingletonEntity,
          referencesToInstances: this._referencesToInstances,
          validate: this.#strucurallyValidateInstance.bind(this),
          localeEntity: this.schema.localeEntity,
          steps: [],
        }),
      )

      const txtResult = txn.getResult()

      const { data: newData, referencesToInstances: newRefs, steps } = txtResult

      const changedEntities = [...new Set(steps.map(step => step.entity.name))] as Extract<
        keyof (T["entityMap"] & T["singletonEntityMap"]),
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
      const diskResult = await applyStepsToDisk(this.dataRootPath, steps, this._formatterOptions)

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
          this.dataRootPath,
          this.#git.root,
          status,
        )
        debug("Git status updated")

        this._data = newDbWithUpdatedGit
      } else {
        debug("No git repository, skipping git status update")
        this._data = newData
      }

      this._referencesToInstances = newRefs

      this.#locked = false
      debug("Transaction successful, released lock")
      this.#hooks["transaction:after"]?.forEach(hook => hook(this))
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
      txn.createInstance(this.schema.getEntity(entityName)!, content, id),
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
      txn.updateInstance(this.schema.getEntity(entityName)!, id, content),
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
      txn.deleteInstance(this.schema.getEntity(entityName)!, id),
    )

    return res.content as Entity<T, E>
  }

  /**
   * Creates a new singleton instance in the database.
   *
   * If the instance is of the locale entity, a locale identifier must be provided as `id`.
   * @throws {Error} when the instance could not be created
   */
  async createSingletonInstance<E extends SingletonEntityName<T>>(
    entityName: E,
    content: SingletonEntity<T, E>,
  ): Promise<SingletonInstanceContainer<SingletonEntity<T, E>>> {
    const res = await this.runTransaction(txn =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      txn.createSingletonInstance(this.schema.getSingletonEntity(entityName)!, content),
    )

    return res as SingletonInstanceContainer<SingletonEntity<T, E>>
  }

  /**
   * Updates a singleton instance in the database.
   *
   * @throws {Error} when the instance could not be updated
   */
  async updateSingletonInstance<E extends SingletonEntityName<T>>(
    entityName: E,
    content: SingletonEntity<T, E>,
  ): Promise<SingletonInstanceContainer<SingletonEntity<T, E>>> {
    const res = await this.runTransaction(txn =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      txn.updateSingletonInstance(this.schema.getSingletonEntity(entityName)!, content),
    )

    return res as SingletonInstanceContainer<SingletonEntity<T, E>>
  }

  /**
   * Deletes a singleton instance in the database.
   *
   * @throws {Error} when the instance could not be deleted
   */
  async deleteSingletonInstance<E extends SingletonEntityName<T>>(
    entityName: E,
  ): Promise<SingletonEntity<T, E>> {
    const res = await this.runTransaction(txn =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      txn.deleteSingletonInstance(this.schema.getSingletonEntity(entityName)!),
    )

    return res.content as SingletonEntity<T, E>
  }

  /**
   * Reorders all instances of an entity in the database.
   *
   * The entity must have a custom sort order via an integer field defined.
   *
   * @throws {Error}
   */
  async reorderAllInstancesOfEntity(
    entityName: EntityName<T> | EntityDecl<EntityName<T>>,
    newOrder: string[],
  ): Promise<void> {
    return this.runTransaction(txn => [
      txn.reorderAllInstancesOfEntity(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        typeof entityName === "string" ? this.schema.getEntity(entityName)! : entityName,
        newOrder,
      ),
      undefined,
    ])
  }

  /**
   * Reorders an instance of an entity in the database.
   *
   * The entity must have a custom sort order via an integer field defined.
   *
   * @throws {Error}
   */
  async reorderInstanceOfEntity(
    entityName: EntityName<T> | EntityDecl<EntityName<T>>,
    instanceId: string,
    newIndex: number,
  ): Promise<[id: string, oldContent: InstanceContent, newContent: InstanceContent][]> {
    return this.runTransaction(txn =>
      txn.reorderInstanceOfEntity(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        typeof entityName === "string" ? this.schema.getEntity(entityName)! : entityName,
        instanceId,
        newIndex,
      ),
    )
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
   * Registers a new hook for the specified trigger. The callback will be invoked whenever the trigger is activated.
   */
  registerHook(trigger: HookTrigger, callback: (db: TSONDB<T>) => void): void {
    ;(this.#hooks[trigger] ??= []).push(callback)
  }

  /**
   * Unregisters a hook for the specified trigger.
   */
  unregisterHook(trigger: HookTrigger, callback: (db: TSONDB<T>) => void): void {
    const callbacks = this.#hooks[trigger]
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Compresses the entire database into a single JSON file at the specified path.
   *
   * Instead of storing each instance in its own file, this method serializes the entire database into a single JSON file. This can be useful for backup, transfer or archiving purposes. The resulting file contains all instances organized by entity names. No spaces or indentation are used in the JSON output to minimize file size.
   * @param path The file path where the compressed database will be saved.
   * @param indentation Optional. If provided, the JSON output will be formatted with the specified number of spaces for indentation. If not provided, the output will be minified without any extra spaces.
   */
  async compressToSingleFile(path: string, indentation?: number): Promise<void> {
    await writeFile(
      path,
      JSON.stringify(
        createCompressedDatabaseFile(this._data, this.schema.version),
        undefined,
        indentation,
      ),
      "utf-8",
    )
  }

  serve(config: ServerOptions, callback?: (error?: NodeJS.ErrnoException) => void): void {
    createServer(
      this,
      { serverOptions: config, validationOptions: this._validationOptions },
      callback,
    )
  }
}

export type TSONDBWithGit<T extends DefaultTSONDBTypes = DefaultTSONDBTypes> = TSONDB<T> & {
  git: Git<T>
}

export type { Config } from "./config.ts"
