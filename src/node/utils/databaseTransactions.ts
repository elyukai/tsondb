import type { SimpleGit } from "simple-git"
import type { InstanceContainer, InstanceContent } from "../../shared/utils/instances.ts"
import { isError, map, ok, type Result } from "../../shared/utils/result.ts"
import type { EntityDecl } from "../schema/index.ts"
import {
  deleteInstanceInDatabaseInMemory,
  setInstanceInDatabaseInMemory,
  type DatabaseInMemory,
} from "./databaseInMemory.ts"
import { applyStepsToDisk } from "./databaseOnDisk.ts"
import { attachGitStatusToDatabaseInMemory } from "./git.ts"
import { updateReferencesToInstances, type ReferencesToInstances } from "./references.ts"
import { checkUniqueConstraintsForAllEntities } from "./unique.ts"

export type TransactionStep =
  | {
      kind: "set"
      entity: EntityDecl
      instanceId: string
      instance: InstanceContent
      oldInstance: InstanceContent | undefined
    }
  | {
      kind: "delete"
      entity: EntityDecl
      instanceId: string
      oldInstance: InstanceContent
    }

export type TransactionResult<A extends object = object> = Result<
  {
    entitiesByName: Record<string, EntityDecl>
    db: DatabaseInMemory
    refs: ReferencesToInstances
    steps: TransactionStep[]
  } & A,
  Error
>

/**
 * Run a transaction on the database in memory, applying all changes to disk if successful.
 */
export const runDatabaseTransaction = async (
  root: string,
  git: SimpleGit | undefined,
  entitiesByName: Record<string, EntityDecl>,
  database: DatabaseInMemory,
  references: ReferencesToInstances,
  locales: string[],
  transactionFn: (db: TransactionResult) => TransactionResult<{
    instanceContainer: InstanceContainer
  }>,
): Promise<
  Result<
    {
      db: DatabaseInMemory
      refs: ReferencesToInstances
      instanceContainer: InstanceContainer
    },
    Error
  >
> => {
  const result = transactionFn(
    ok({
      db: database,
      entitiesByName,
      refs: references,
      steps: [],
    }),
  )

  if (isError(result)) {
    return result
  }

  const { db: newDb, refs: newRefs, steps, instanceContainer } = result.value

  const constraintResult = checkUniqueConstraintsForAllEntities(newDb, entitiesByName, locales)

  if (isError(constraintResult)) {
    return constraintResult
  }

  const diskResult = await applyStepsToDisk(root, steps)

  if (isError(diskResult)) {
    return diskResult
  }

  if (git !== undefined) {
    const status = await git.status()
    const repoRoot = await git.revparse(["--show-toplevel"])
    const newDbWithUpdatedGit = attachGitStatusToDatabaseInMemory(newDb, root, repoRoot, status)
    return ok({ db: newDbWithUpdatedGit, refs: newRefs, instanceContainer })
  }

  return ok({ db: newDb, refs: newRefs, instanceContainer })
}

/**
 * Function to be used within a transaction to set an instance in the database.
 *
 * Note that the transaction result is immutable, so the returned `TransactionResult` must be used for further operations.
 */
export const setInstanceT = (
  res: TransactionResult,
  entity: EntityDecl,
  instance: InstanceContainer,
): TransactionResult =>
  map(res, ({ db, steps, refs, entitiesByName }) => {
    const [updatedDb, oldInstance] = setInstanceInDatabaseInMemory(db, entity.name, instance)

    const updatedRefs = updateReferencesToInstances(
      entitiesByName,
      refs,
      entity.name,
      instance.id,
      oldInstance,
      instance.content,
    )

    const step: TransactionStep = {
      kind: "set",
      entity,
      instanceId: instance.id,
      instance: instance.content,
      oldInstance,
    }

    return {
      db: updatedDb,
      steps: [...steps, step],
      refs: updatedRefs,
      entitiesByName,
      additionalInformation: undefined,
    }
  })

// /**
//  * Function to set an instance in the database directly.
//  *
//  * This is the same as running a singular set transaction.
//  */
// export const setInstance = (
//   root: string,
//   db: DatabaseInMemory,
//   entity: EntityDecl,
//   instance: InstanceContainer,
// ): Promise<Result<DatabaseInMemory, Error>> =>
//   runTransaction(root, db, res => setInstanceT(res, entity, instance))

/**
 * Function to be used within a transaction to delete an instance from the database.
 *
 * Note that the transaction result is immutable, so the returned `TransactionResult` must be used for further operations.
 */
export const deleteInstanceT = (
  res: TransactionResult,
  entity: EntityDecl,
  instanceId: string,
): TransactionResult =>
  map(res, tres => {
    const { db, steps, refs, entitiesByName } = tres
    const [updatedDb, oldInstance] = deleteInstanceInDatabaseInMemory(db, entity.name, instanceId)

    if (oldInstance === undefined) {
      // instance did not exist, no-op
      return tres
    }

    const updatedRefs = updateReferencesToInstances(
      entitiesByName,
      refs,
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

    return {
      db: updatedDb,
      steps: [...steps, step],
      refs: updatedRefs,
      entitiesByName,
      additionalInformation: undefined,
    }
  })

// /**
//  * Function to delete an instance from the database directly.
//  *
//  * This is the same as running a singular deletion transaction.
//  */
// export const deleteInstance = (
//   root: string,
//   db: DatabaseInMemory,
//   entityName: string,
//   instanceId: string,
// ): Promise<Result<DatabaseInMemory, Error>> =>
//   runTransaction(root, db, res => deleteInstanceT(res, entityName, instanceId))
