import Debug from "debug"
import { resolve } from "node:path"
import type { SerializedDecl } from "../../shared/schema/declarations/Declaration.ts"
import { difference, removeAt } from "../../shared/utils/array.ts"
import type { InstanceContainer } from "../../shared/utils/instances.ts"
import { isOk } from "../../shared/utils/result.ts"
import type { EntityDecl } from "../schema/declarations/EntityDecl.ts"
import { getReferencesForEntityDecl } from "../schema/declarations/EntityDecl.ts"
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
  instancesByEntityName: Record<string, InstanceContainer[]>,
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
    Object.entries(instancesByEntityName).map(
      ([entityName, instances]) =>
        new Promise<ReferencesToInstances>((resolve, reject) => {
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
        }),
    ),
  )

  await pool.close()
  const results = separateResults.reduce(mergeReferences, {})

  debug("collected references")

  return results
}

export const updateReferencesToInstances = (
  entitiesByName: Record<string, EntityDecl>,
  referencesToInstances: ReferencesToInstances,
  entityName: string,
  instanceId: string,
  oldInstance: unknown,
  newInstance: unknown,
): ReferencesToInstances => {
  const entity = entitiesByName[entityName]
  if (entity) {
    if (oldInstance === undefined) {
      return addReferences(
        referencesToInstances,
        getReferencesForEntityDecl(entity, newInstance),
        instanceId,
      )
    }

    if (newInstance === undefined) {
      return removeReferences(
        referencesToInstances,
        getReferencesForEntityDecl(entity, oldInstance),
        instanceId,
      )
    }

    const oldReferences = getReferencesForEntityDecl(entity, oldInstance)
    const newReferences = getReferencesForEntityDecl(entity, newInstance)

    const { added, removed } = difference(oldReferences, newReferences)

    return removeReferences(
      addReferences(referencesToInstances, added, instanceId),
      removed,
      instanceId,
    )
  }

  return referencesToInstances
}
