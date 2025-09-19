import Debug from "debug"
import { resolve } from "node:path"
import { difference, removeAt } from "../../shared/utils/array.ts"
import type { InstanceContainer } from "../../shared/utils/instances.ts"
import { isOk } from "../../shared/utils/result.ts"
import type { EntityDecl } from "../schema/declarations/EntityDecl.ts"
import { getReferencesForEntityDecl } from "../schema/declarations/EntityDecl.ts"
import { type SerializedDecl } from "../schema/index.ts"
import type { ReferencesWorkerTask } from "./referencesWorker.ts"
import { WorkerPool } from "./workers.ts"

const debug = Debug("tsondb:utils:references")

/**
 * A mapping from instance IDs to the list of instance IDs that reference them.
 */
export type ReferencesToInstances = {
  [instanceId: string]: string[]
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
): ReferencesToInstances =>
  Object.entries(toMerge).reduce(
    (acc1, [reference, instanceIds]) =>
      instanceIds.reduce((acc2, instanceId) => addReference(acc2, reference, instanceId), acc1),
    acc,
  )

const removeReference = (
  acc: ReferencesToInstances,
  reference: string,
  instanceId: string,
): ReferencesToInstances =>
  acc[reference]
    ? {
        ...acc,
        [reference]: removeAt(acc[reference], acc[reference].indexOf(instanceId)),
      }
    : acc

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
  debug("collecting references ...")
  const pool = new WorkerPool<
    ReferencesWorkerTask,
    ReferencesToInstances,
    Record<string, SerializedDecl>
  >(6, resolve(import.meta.filename, "./referencesWorker.js"), serializedDeclarationsByName)

  const results = (
    await Promise.all(
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
  ).reduce(mergeReferences)

  await pool.close()

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
