import { on } from "@elyukai/utils/function"
import { compareNumber, reduceCompare } from "@elyukai/utils/ordering"
import Debug from "debug"
import { stderr } from "node:process"
import { styleText } from "node:util"
import type {
  InstanceContainer,
  InstanceContainerOverview,
  SingletonInstanceContainer,
} from "../shared/utils/instances.ts"
import type { FormatterOptions } from "./config.ts"
import {
  TSONDB,
  type ChildEntity,
  type ChildEntityConfig,
  type ChildEntityName,
  type DefaultTSONDBTypes,
  type Entity,
  type EntityName,
  type SingletonEntityName,
  type TSONDBOptions,
  type ValidationOptions,
} from "./index.ts"
import type { Output } from "./output.ts"
import { getDisplayName, getDisplayNameWithId } from "./schema/detached.ts"
import type { EntityDecl } from "./schema/dsl/index.ts"
import type { IdArgsVariant } from "./schema/generatedTypeHelpers.ts"
import { isEntityDeclWithParentReference } from "./schema/guards.ts"
import type { Schema } from "./schema/index.ts"
import { checkLocales, generateOutputs, initData, prepareFolders, validate } from "./shared.ts"
import { DatabaseInMemory } from "./utils/databaseInMemory.ts"
import {
  getAllInstanceOverviewsByEntityName,
  getDisplayNameFromEntityInstance,
  getInstanceOverview,
  getInstanceOverviewsByEntityName,
} from "./utils/displayName.ts"
import { formatInstance, readInstance, readSingletonInstance } from "./utils/files.ts"
import { isReferencedByOtherInstances, type ReferencesToInstances } from "./utils/references.ts"

const debug = Debug("tsondb:readonly")

/**
 * The main class for managing a typed JSON database that is read-only.
 */
export class ReadonlyTSONDB<T extends DefaultTSONDBTypes = DefaultTSONDBTypes> {
  protected _data: DatabaseInMemory<T["entityMap"], T["singletonEntityMap"]>
  #dataRootPath: string
  #schema: Schema<T>
  #locales: string[]
  protected _referencesToInstances: ReferencesToInstances
  protected _validationOptions: ValidationOptions
  protected _formatterOptions: Partial<FormatterOptions> | undefined

  protected constructor(options: {
    dataRootPath: string
    data: DatabaseInMemory<T["entityMap"], T["singletonEntityMap"]>
    schema: Schema<T>
    locales?: string[]
    referencesToInstances: ReferencesToInstances
    validationOptions: ValidationOptions
    formatterOptions?: Partial<FormatterOptions> | undefined
  }) {
    this.#dataRootPath = options.dataRootPath
    this._data = options.data
    this.#schema = options.schema
    this.#locales = options.locales ?? []
    this._referencesToInstances = options.referencesToInstances
    this._validationOptions = options.validationOptions
    this._formatterOptions = options.formatterOptions
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
  ): Promise<ReadonlyTSONDB<Types>> {
    const { entities } = options.schema

    debug("using data root path: %s", options.dataRootPath)
    await prepareFolders(options.schema.version, options.dataRootPath, entities)
    debug("prepared folders")

    const { localeEntity } = options.schema

    if (!localeEntity && options.locales) {
      throw new Error("Schema does not contain a locale entity, locales cannot be provided.")
    }

    const { data, referencesToInstances } = await initData(
      options.dataRootPath,
      options.schema,
      options.locales ?? [],
      undefined,
      undefined,
      skipReferenceCache,
      true,
    )

    const db = new ReadonlyTSONDB<Types>({
      ...options,
      data,
      referencesToInstances,
      validationOptions: {
        checkReferentialIntegrity: true,
        checkOnlyEntities: [],
        ...options.validationOptions,
      },
    })

    return db
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

  #validate(
    data: DatabaseInMemory<T["entityMap"], T["singletonEntityMap"]>,
    options: {
      logToConsole?: boolean
      skipStructuralValidation?: boolean
      changedEntities?: Extract<keyof (T["entityMap"] & T["singletonEntityMap"]), string>[]
    } = {},
  ): Error[] {
    return validate(
      {
        data,
        dataRootPath: this.#dataRootPath,
        locales: this.#locales,
        schema: this.#schema,
        validationOptions: this._validationOptions,
      },
      options,
    )
  }

  /**
   * Validates the data in the database.
   *
   * Returns `true` if the data is valid, `false` otherwise.
   */
  validate(): boolean {
    debug("Validating database ...")
    return this.#validate(this._data).length === 0
  }

  /**
   * Checks if the data on disk is formatted according to the current in-memory representation.
   */
  async checkFormat(): Promise<boolean> {
    debug("Check database formatting ...")

    let counter = 0
    let total = 0

    await this._data.forEachInstance(async (entityName, instance) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entity = this.#schema.getEntity(entityName)!
      const instanceOnDisk = await readInstance(this.#dataRootPath, entity, instance.id)
      const currentFormatted = formatInstance(entity, instance.content, this._formatterOptions)
      if (instanceOnDisk !== currentFormatted) {
        console.log(
          `Instance ${styleText("yellow", instance.id)} of entity ${styleText("cyan", entityName)} is not formatted correctly.`,
        )
        counter++
      }
      total++
    }, true)

    await this._data.forEachSingletonInstance(async (entityName, instance) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entity = this.#schema.getSingletonEntity(entityName)!
      const instanceOnDisk = await readSingletonInstance(this.#dataRootPath, entity)
      const currentFormatted = formatInstance(entity, instance.content, this._formatterOptions)
      if (instanceOnDisk !== currentFormatted) {
        console.log(
          `Singleton instance of entity ${styleText("cyan", entityName)} is not formatted correctly.`,
        )
        counter++
      }
      total++
    }, true)

    if (counter === 0) {
      console.log(
        styleText(
          "green",
          `All ${total.toFixed()} instance${total === 1 ? "" : "s"} are formatted correctly`,
        ),
      )
      return true
    } else {
      console.error(
        styleText(
          "red",
          `${counter.toFixed()} instance${counter === 1 ? "" : "s"} of ${total.toFixed()} instance${total === 1 ? "" : "s"} are not formatted correctly`,
          {
            stream: stderr,
          },
        ),
      )
      return false
    }
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
      undefined,
      undefined,
      false,
      !(this instanceof TSONDB),
    )

    this._data = data
    this._referencesToInstances = referencesToInstances
    debug("Synced with disk")
  }

  /**
   * Retrieves an instance of the specified entity by its identifier.
   */
  getInstanceOfEntityById<E extends EntityName<T>>(
    ...args: IdArgsVariant<T["entityMap"], E>
  ): T["entityMap"][E] | undefined {
    return this._data.getInstanceContainerOfEntityById(...args)?.content
  }

  /**
   * Retrieves the instance container of the specified entity by its identifier.
   */
  getInstanceContainerOfEntityById<E extends EntityName<T>>(
    ...args: IdArgsVariant<T["entityMap"], E>
  ): InstanceContainer<T["entityMap"][E]> | undefined {
    return this._data.getInstanceContainerOfEntityById(...args)
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
    return this._data.getAllInstanceContainersOfEntity(entityName).map(ic => ic.content)
  }

  /**
   * Retrieves all instance containers of the specified entity.
   */
  getAllInstanceContainersOfEntity<E extends EntityName<T>>(
    entityName: E,
  ): InstanceContainer<Entity<T, E>>[] {
    return this._data.getAllInstanceContainersOfEntity(entityName)
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
   * Retrieves an instance of the specified entity by its identifier.
   */
  getSingletonInstanceOfEntity<E extends SingletonEntityName<T>>(
    entityName: E,
  ): T["singletonEntityMap"][E] | undefined {
    return this._data.getSingletonInstanceOfEntity(entityName)
  }

  /**
   * Retrieves the instance container of the specified entity by its identifier.
   */
  getSingletonInstanceContainerOfEntity<E extends SingletonEntityName<T>>(
    entityName: E,
  ): SingletonInstanceContainer<T["singletonEntityMap"][E]> | undefined {
    return this._data.getSingletonInstanceContainerOfEntity(entityName)
  }

  /**
   * Counts the number of instances registered for the specified entity.
   */
  countInstancesOfEntity(entityName: EntityName<T>): number {
    return this._data.countInstancesOfEntity(entityName)
  }

  /**
   * Returns whether the singleton entity has an instance.
   */
  hasInstanceOfSingletonEntity(entityName: SingletonEntityName<T>): boolean {
    return this._data.hasInstanceOfSingletonEntity(entityName)
  }

  /**
   * Retrieves overviews for all instances in the database, grouped by entity name.
   */
  getAllInstanceOverviews(): Record<EntityName<T>, InstanceContainerOverview[]> {
    return getAllInstanceOverviewsByEntityName(
      this.#schema.getEntity.bind(this.#schema),
      this._data,
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
    return this._data.getAllChildInstanceContainersForParent(
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
      this._data,
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
      this._data,
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
      this._referencesToInstances,
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
   * Sets the locales for this TSONDB instance.
   *
   * The provided locales must exist in the database if a locale entity is defined in the schema.
   */
  setLocales(locales: string[]): void {
    checkLocales(this.#schema, this._data, locales)
    this.#locales = locales
  }

  /**
   * The loaded schema for this TSONDB instance.
   */
  get schema(): Schema<T> {
    return this.#schema
  }

  get dataRootPath(): string {
    return this.#dataRootPath
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

    return this._data
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
    return this._data.getEntityNameOfInstanceId(id)
  }
}

export type { Config } from "./config.ts"
