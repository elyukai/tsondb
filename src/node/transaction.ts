import { randomUUID } from "node:crypto"
import type { InstanceContainer, InstanceContent } from "../shared/utils/instances.ts"
import type { ValidationOptions } from "./index.ts"
import type { AnyEntityMap, RegisteredEntityMap } from "./schema/externalTypes.ts"
import {
  createValidationContext,
  validateEntityDecl,
  type EntityDecl,
  type GetEntityByName,
} from "./schema/index.ts"
import {
  deleteInstanceInDatabaseInMemory,
  getInstanceOfEntityFromDatabaseInMemory,
  setInstanceInDatabaseInMemory,
  type DatabaseInMemory,
} from "./utils/databaseInMemory.ts"
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

type TransactionShared<EM extends AnyEntityMap = RegisteredEntityMap> = {
  data: DatabaseInMemory<EM>
  referencesToInstances: ReferencesToInstances
  steps: TransactionStep[]
  getEntity: GetEntityByName<EM>
  validationOptions: ValidationOptions
  localeEntity: EntityDecl | undefined
}

export const createNewId = () => randomUUID()

/**
 * @throws {HTTPError}
 */
const checkCreateInstancePossible = (
  validationOptions: ValidationOptions,
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
    getInstanceOfEntityFromDatabaseInMemory(databaseInMemory, entity.name, newInstanceId) !==
      undefined
  ) {
    throw new HTTPError(400, `Duplicate id "${newInstanceId}" for locale entity`)
  }

  checkUpdateInstancePossible(validationOptions, databaseInMemory, entity, instanceContent)

  return newInstanceId
}

/**
 * @throws {HTTPError}
 */
const checkUpdateInstancePossible = (
  validationOptions: Partial<ValidationOptions>,
  databaseInMemory: DatabaseInMemory,
  entity: EntityDecl,
  instanceContent: InstanceContent,
): void => {
  const validationErrors = validateEntityDecl(
    createValidationContext(validationOptions, databaseInMemory, false),
    [],
    entity,
    instanceContent,
  )

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

export class Transaction<EM extends AnyEntityMap = RegisteredEntityMap> {
  #values: TransactionShared<EM>

  constructor(values: TransactionShared<EM>) {
    this.#values = values
  }

  createInstance(
    entity: EntityDecl<Extract<keyof EM, string>>,
    instanceContent: InstanceContent,
    instanceId?: string,
  ): [Transaction<EM>, InstanceContainer] {
    const { data, steps, referencesToInstances, getEntity, validationOptions, localeEntity } =
      this.#values
    const newId = checkCreateInstancePossible(
      validationOptions,
      localeEntity,
      data,
      entity,
      instanceContent,
      instanceId,
    )
    const [updatedDb] = setInstanceInDatabaseInMemory(data, entity.name, {
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
  ): [Transaction<EM>, InstanceContainer] {
    const { data, steps, referencesToInstances, getEntity, validationOptions } = this.#values
    checkUpdateInstancePossible(validationOptions, data, entity, instanceContent)
    const [updatedDb, oldInstance] = setInstanceInDatabaseInMemory(data, entity.name, {
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
  ): [Transaction<EM>, InstanceContainer] {
    const { data, steps, referencesToInstances, getEntity } = this.#values
    checkDeleteInstancePossible(referencesToInstances, instanceId)
    const [updatedDb, oldInstance] = deleteInstanceInDatabaseInMemory(data, entity.name, instanceId)

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

  /**
   * @package
   */
  getResult(): TransactionShared<EM> {
    return this.#values
  }
}
