import { randomUUID } from "node:crypto"
import type {
  InstanceContainer,
  InstanceContent,
  SingletonInstanceContainer,
} from "../shared/utils/instances.ts"
import { type EntityDecl, type SingletonEntityDecl } from "./schema/dsl/index.ts"
import type {
  AnyEntityMap,
  AnySingletonEntityMap,
  GetEntityByName,
  GetSingletonEntityByName,
  RegisteredEntityMap,
  RegisteredSingletonEntityMap,
} from "./schema/generatedTypeHelpers.ts"
import { type DatabaseInMemory } from "./utils/databaseInMemory.ts"
import { getErrorMessageForDisplay, HTTPError } from "./utils/error.js"
import {
  isReferencedByOtherInstances,
  updateReferencesToInstances,
  type ReferencesToInstances,
} from "./utils/references.ts"

export type TransactionStep =
  | {
      kind: "create"
      entity: EntityDecl
      instanceId: string
      instanceContent: InstanceContent
    }
  | {
      kind: "update"
      entity: EntityDecl
      instanceId: string
      instanceContent: InstanceContent
      oldInstance: InstanceContent
    }
  | {
      kind: "delete"
      entity: EntityDecl
      instanceId: string
      oldInstance: InstanceContent
    }
  | {
      kind: "createSingleton"
      entity: SingletonEntityDecl
      instanceContent: InstanceContent
    }
  | {
      kind: "updateSingleton"
      entity: SingletonEntityDecl
      instanceContent: InstanceContent
      oldInstance: InstanceContent
    }
  | {
      kind: "deleteSingleton"
      entity: SingletonEntityDecl
      oldInstance: InstanceContent
    }

type TransactionShared<
  EM extends AnyEntityMap = RegisteredEntityMap,
  SEM extends AnySingletonEntityMap = RegisteredSingletonEntityMap,
> = {
  data: DatabaseInMemory<EM, SEM>
  referencesToInstances: ReferencesToInstances
  steps: TransactionStep[]
  getEntity: GetEntityByName<EM>
  getSingletonEntity: GetSingletonEntityByName<EM>
  validate: (entity: EntityDecl | SingletonEntityDecl, instanceContent: InstanceContent) => Error[]
  localeEntity: EntityDecl | undefined
}

export const createNewId = () => randomUUID()

/**
 * @throws {HTTPError}
 */
const checkCreateInstancePossible = (
  validate: (entity: EntityDecl, instanceContent: InstanceContent) => Error[],
  localeEntity: EntityDecl | undefined,
  databaseInMemory: DatabaseInMemory,
  entity: EntityDecl,
  instanceContent: InstanceContent,
  customId: string | undefined,
): string => {
  const newInstanceId = entity === localeEntity ? customId : createNewId()

  if (typeof newInstanceId !== "string") {
    throw new HTTPError(400, `New identifier "${String(newInstanceId)}" is not a string`)
  }

  if (
    localeEntity === entity &&
    databaseInMemory.hasInstanceOfEntityById(entity.name, newInstanceId)
  ) {
    throw new HTTPError(400, `Duplicate id "${newInstanceId}" for locale entity`)
  }

  checkUpdateInstancePossible(validate, entity, instanceContent)

  return newInstanceId
}

/**
 * @throws {HTTPError}
 */
const checkUpdateInstancePossible = (
  validate: (entity: EntityDecl, instanceContent: InstanceContent) => Error[],
  entity: EntityDecl,
  instanceContent: InstanceContent,
): void => {
  const validationErrors = validate(entity, instanceContent)

  if (validationErrors.length > 0) {
    throw new HTTPError(400, validationErrors.map(getErrorMessageForDisplay).join("\n\n"))
  }
}

const checkDeleteInstancePossible = (
  referencesToInstances: ReferencesToInstances,
  instanceId: string,
): void => {
  if (isReferencedByOtherInstances(referencesToInstances, instanceId)) {
    throw new HTTPError(400, "Cannot delete instance that is referenced by other instances")
  }
}

/**
 * @throws {HTTPError}
 */
const checkCreateSingletonInstancePossible = (
  validate: (entity: SingletonEntityDecl, instanceContent: InstanceContent) => Error[],
  databaseInMemory: DatabaseInMemory,
  entity: SingletonEntityDecl,
  instanceContent: InstanceContent,
): void => {
  if (databaseInMemory.hasInstanceOfSingletonEntity(entity.name)) {
    throw new HTTPError(400, `Duplicate instance for singleton entity`)
  }

  checkUpdateSingletonInstancePossible(validate, entity, instanceContent)
}

/**
 * @throws {HTTPError}
 */
const checkUpdateSingletonInstancePossible = (
  validate: (entity: SingletonEntityDecl, instanceContent: InstanceContent) => Error[],
  entity: SingletonEntityDecl,
  instanceContent: InstanceContent,
): void => {
  const validationErrors = validate(entity, instanceContent)

  if (validationErrors.length > 0) {
    throw new HTTPError(400, validationErrors.map(getErrorMessageForDisplay).join("\n\n"))
  }
}

const checkDeleteSingletonInstancePossible = (): void => {
  // cannot be referenced and does not have any integration into other areas, so no checks needed
}

export class Transaction<
  EM extends AnyEntityMap = RegisteredEntityMap,
  SEM extends AnySingletonEntityMap = RegisteredSingletonEntityMap,
> {
  #values: TransactionShared<EM, SEM>

  constructor(values: TransactionShared<EM, SEM>) {
    this.#values = values
  }

  createInstance(
    entity: EntityDecl<Extract<keyof EM, string>>,
    instanceContent: InstanceContent,
    instanceId?: string,
  ): [Transaction<EM, SEM>, InstanceContainer] {
    const { data, steps, referencesToInstances, getEntity, validate, localeEntity } = this.#values
    const newId = checkCreateInstancePossible(
      validate,
      localeEntity,
      data,
      entity,
      instanceContent,
      instanceId,
    )
    const [updatedDb] = data.setInstanceContainerOfEntityById(entity.name, {
      id: newId,
      content: instanceContent,
    })

    const updatedRefs = updateReferencesToInstances(
      getEntity,
      referencesToInstances,
      entity.name,
      newId,
      undefined,
      instanceContent,
    )

    const step: TransactionStep = {
      kind: "create",
      entity,
      instanceId: newId,
      instanceContent,
    }

    return [
      new Transaction({
        ...this.#values,
        data: updatedDb,
        steps: [...steps, step],
        referencesToInstances: updatedRefs,
      }),
      { id: newId, content: instanceContent },
    ]
  }

  updateInstance(
    entity: EntityDecl<Extract<keyof EM, string>>,
    instanceId: string,
    instanceContent: InstanceContent,
  ): [Transaction<EM, SEM>, InstanceContainer] {
    const { data, steps, referencesToInstances, getEntity, validate } = this.#values
    checkUpdateInstancePossible(validate, entity, instanceContent)
    const [updatedDb, oldInstance] = data.setInstanceContainerOfEntityById(entity.name, {
      id: instanceId,
      content: instanceContent,
    })

    if (oldInstance === undefined) {
      throw new HTTPError(
        400,
        `Instance with id "${instanceId}" of entity "${entity.name}" did not yet exist`,
      )
    }

    const updatedRefs = updateReferencesToInstances(
      getEntity,
      referencesToInstances,
      entity.name,
      instanceId,
      oldInstance,
      instanceContent,
    )

    const step: TransactionStep = {
      kind: "update",
      entity,
      instanceId,
      instanceContent,
      oldInstance,
    }

    return [
      new Transaction({
        ...this.#values,
        data: updatedDb,
        steps: [...steps, step],
        referencesToInstances: updatedRefs,
      }),
      { id: instanceId, content: instanceContent },
    ]
  }

  deleteInstance(
    entity: EntityDecl<Extract<keyof EM, string>>,
    instanceId: string,
  ): [Transaction<EM, SEM>, InstanceContainer] {
    const { data, steps, referencesToInstances, getEntity } = this.#values
    checkDeleteInstancePossible(referencesToInstances, instanceId)
    const [updatedDb, oldInstance] = data.deleteInstanceContainerOfEntityById(
      entity.name,
      instanceId,
    )

    if (oldInstance === undefined) {
      // instance did not exist
      throw new Error("Instance did not exist")
    }

    const updatedRefs = updateReferencesToInstances(
      getEntity,
      referencesToInstances,
      entity.name,
      instanceId,
      oldInstance,
      undefined,
    )

    const step: TransactionStep = {
      kind: "delete",
      entity,
      instanceId,
      oldInstance,
    }

    return [
      new Transaction({
        ...this.#values,
        data: updatedDb,
        steps: [...steps, step],
        referencesToInstances: updatedRefs,
      }),
      { id: instanceId, content: oldInstance },
    ]
  }

  createSingletonInstance(
    entity: SingletonEntityDecl<Extract<keyof SEM, string>>,
    instanceContent: InstanceContent,
  ): [Transaction<EM, SEM>, SingletonInstanceContainer] {
    const { data, steps, referencesToInstances, getEntity, validate } = this.#values
    checkCreateSingletonInstancePossible(validate, data, entity, instanceContent)
    const [updatedDb] = data.setInstanceContainerOfSingletonEntity(entity.name, {
      content: instanceContent,
    })

    const updatedRefs = updateReferencesToInstances(
      getEntity,
      referencesToInstances,
      entity.name,
      entity.name,
      undefined,
      instanceContent,
    )

    const step: TransactionStep = {
      kind: "createSingleton",
      entity,
      instanceContent,
    }

    return [
      new Transaction({
        ...this.#values,
        data: updatedDb,
        steps: [...steps, step],
        referencesToInstances: updatedRefs,
      }),
      { content: instanceContent },
    ]
  }

  updateSingletonInstance(
    entity: SingletonEntityDecl<Extract<keyof SEM, string>>,
    instanceContent: InstanceContent,
  ): [Transaction<EM, SEM>, SingletonInstanceContainer] {
    const { data, steps, referencesToInstances, getEntity, validate } = this.#values
    checkUpdateSingletonInstancePossible(validate, entity, instanceContent)
    const [updatedDb, oldInstance] = data.setInstanceContainerOfSingletonEntity(entity.name, {
      content: instanceContent,
    })

    if (oldInstance === undefined) {
      throw new HTTPError(400, `Singleton instance of entity "${entity.name}" did not yet exist`)
    }

    const updatedRefs = updateReferencesToInstances(
      getEntity,
      referencesToInstances,
      entity.name,
      entity.name,
      oldInstance,
      instanceContent,
    )

    const step: TransactionStep = {
      kind: "updateSingleton",
      entity,
      instanceContent,
      oldInstance,
    }

    return [
      new Transaction({
        ...this.#values,
        data: updatedDb,
        steps: [...steps, step],
        referencesToInstances: updatedRefs,
      }),
      { content: instanceContent },
    ]
  }

  deleteSingletonInstance(
    entity: SingletonEntityDecl<Extract<keyof SEM, string>>,
  ): [Transaction<EM, SEM>, SingletonInstanceContainer] {
    const { data, steps, referencesToInstances, getEntity } = this.#values
    checkDeleteSingletonInstancePossible()
    const [updatedDb, oldInstance] = data.deleteInstanceContainerOfSingletonEntity(entity.name)

    if (oldInstance === undefined) {
      // instance did not exist
      throw new Error("Instance did not exist")
    }

    const updatedRefs = updateReferencesToInstances(
      getEntity,
      referencesToInstances,
      entity.name,
      entity.name,
      oldInstance,
      undefined,
    )

    const step: TransactionStep = {
      kind: "deleteSingleton",
      entity,
      oldInstance,
    }

    return [
      new Transaction({
        ...this.#values,
        data: updatedDb,
        steps: [...steps, step],
        referencesToInstances: updatedRefs,
      }),
      { content: oldInstance },
    ]
  }

  /**
   * @package
   */
  getResult(): TransactionShared<EM> {
    return this.#values
  }
}
