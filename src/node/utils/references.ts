import { removeAt } from "@elyukai/utils/array/modify"
import { difference } from "@elyukai/utils/array/sets"
import { isOk } from "@elyukai/utils/result"
import Debug from "debug"
import { resolve } from "node:path"
import type { SerializedDecl } from "../../shared/schema/declarations/Declaration.ts"
import type { InstanceContent } from "../../shared/utils/instances.ts"
import type {
  AnyEntityMap,
  GetEntityByName,
  RegisteredEntityMap,
} from "../schema/generatedTypeHelpers.ts"
import { getReferences } from "../schema/treeOperations/references.ts"
import { type DatabaseInMemory } from "./databaseInMemory.ts"
import type { ReferencesWorkerTask } from "./referencesWorker.ts"
import { WorkerPool } from "./workers.ts"

const debug = Debug("tsondb:utils:references")

/**
 * A mapping from instance IDs to the list of instance IDs that reference them.
 */
export type ReferencesToInstances = {
  [instanceId: string]: string[]
}

export const isReferencedByOtherInstances = (
  referencesToInstances: ReferencesToInstances,
  instanceId: string,
  otherInstancesToDelete?: string[],
): boolean => {
  const allInstancesToDelete = [instanceId, ...(otherInstancesToDelete ?? [])]
  return referencesToInstances[instanceId]?.some(ref => allInstancesToDelete.includes(ref)) ?? false
}

const addReference = (
  acc: ReferencesToInstances,
  reference: string,
  instanceId: string,
): ReferencesToInstances => ({
  ...acc,
  [reference]: [...(acc[reference] ?? []), instanceId],
})

const addReferences = (
  acc: ReferencesToInstances,
  references: string[],
  instanceId: string,
): ReferencesToInstances =>
  references.reduce((acc1, reference) => addReference(acc1, reference, instanceId), acc)

const mergeReferences = (
  acc: ReferencesToInstances,
  toMerge: ReferencesToInstances,
): ReferencesToInstances => {
  for (const instanceId in toMerge) {
    ;(acc[instanceId] ??= []).push(...(toMerge[instanceId] ?? []))
  }
  return acc
}

const removeReference = (
  acc: ReferencesToInstances,
  reference: string,
  instanceId: string,
): ReferencesToInstances => {
  if (acc[reference]) {
    const index = acc[reference].indexOf(instanceId)

    if (index > -1) {
      return {
        ...acc,
        [reference]: removeAt(acc[reference], index),
      }
    }
  }

  return acc
}

const removeReferences = (
  acc: ReferencesToInstances,
  references: string[],
  instanceId: string,
): ReferencesToInstances =>
  references.reduce((acc1, reference) => removeReference(acc1, reference, instanceId), acc)

export const getReferencesToInstances = async (
  databaseInMemory: DatabaseInMemory,
  serializedDeclarationsByName: Record<string, SerializedDecl>,
) => {
  debug("creating reference worker pool ...")
  const pool = new WorkerPool<
    ReferencesWorkerTask,
    ReferencesToInstances,
    Record<string, SerializedDecl>
  >(6, resolve(import.meta.dirname, "./referencesWorker.js"), serializedDeclarationsByName)

  debug("collecting references ...")
  const separateResults = await Promise.all(
    databaseInMemory.getAllInstances().map(
      ([entityName, instances]) =>
        new Promise<ReferencesToInstances>((resolve, reject) => {
          try {
            debug(
              "collecting references for entity %s in %d instances",
              entityName,
              instances.length,
            )
            pool.runTask({ entityName, instances }, result => {
              if (isOk(result)) {
                debug(
                  "collected references for entity %s in %d instances",
                  entityName,
                  instances.length,
                )
                resolve(result.value)
              } else {
                reject(result.error)
              }
            })
          } catch (err) {
            debug("error collecting references for entity %s: %O", entityName, err)
            reject(err)
          }
        }),
    ),
  )

  await pool.close()
  const results = separateResults.reduce(mergeReferences, {})

  debug("collected references")

  return results
}

export const updateReferencesToInstances = <EM extends AnyEntityMap = RegisteredEntityMap>(
  getEntity: GetEntityByName<EM>,
  referencesToInstances: ReferencesToInstances,
  entityName: Extract<keyof EM, string>,
  instanceId: string,
  oldInstance: InstanceContent | undefined,
  newInstance: InstanceContent | undefined,
): ReferencesToInstances => {
  const entity = getEntity(entityName)
  if (entity) {
    if (oldInstance === undefined) {
      return addReferences(
        referencesToInstances,
        getReferences(entity, newInstance, []),
        instanceId,
      )
    }

    if (newInstance === undefined) {
      return removeReferences(
        referencesToInstances,
        getReferences(entity, oldInstance, []),
        instanceId,
      )
    }

    const oldReferences = getReferences(entity, oldInstance, [])
    const newReferences = getReferences(entity, newInstance, [])

    const { added, removed } = difference(oldReferences, newReferences)

    return removeReferences(
      addReferences(referencesToInstances, added, instanceId),
      removed,
      instanceId,
    )
  }

  return referencesToInstances
}
