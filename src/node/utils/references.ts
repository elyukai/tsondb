import Debug from "debug"
import { difference, removeAt } from "../../shared/utils/array.ts"
import type { InstanceContainer } from "../../shared/utils/instances.ts"
import type { EntityDecl } from "../schema/declarations/EntityDecl.ts"
import { getReferencesForEntityDecl } from "../schema/declarations/EntityDecl.ts"

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

export const getReferencesToInstances = (
  instancesByEntityName: Record<string, InstanceContainer[]>,
  entitiesByName: Record<string, EntityDecl>,
) => {
  debug("collecting references ...")
  return Object.entries(instancesByEntityName).reduce(
    (acc: ReferencesToInstances, [entityName, instances]) => {
      const entity = entitiesByName[entityName]
      if (entity) {
        const refs = instances.reduce((acc1, instance) => {
          const references = getReferencesForEntityDecl(entity, instance.content)
          return addReferences(acc1, references, instance.id)
        }, acc)
        debug("collected references for entity %s in %d instances", entityName, instances.length)
        return refs
      }
      return acc
    },
    {},
  )
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
