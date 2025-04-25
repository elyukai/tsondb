import { EntityDecl, getReferencesForEntityDecl } from "../schema/declarations/EntityDecl.js"
import { difference, removeAt } from "../shared/utils/array.js"
import { InstanceContainer } from "../shared/utils/instances.js"

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
) =>
  Object.entries(instancesByEntityName).reduce(
    (acc: ReferencesToInstances, [entityName, instances]) => {
      const entity = entitiesByName[entityName]
      if (entity) {
        return instances.reduce((acc1, instance) => {
          const references = getReferencesForEntityDecl(entity, instance.content)
          return addReferences(acc1, references, instance.id)
        }, acc)
      }
      return acc
    },
    {},
  )

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

    const oldReferences =
      oldInstance === undefined ? [] : getReferencesForEntityDecl(entity, oldInstance)
    const newReferences =
      newInstance === undefined ? [] : getReferencesForEntityDecl(entity, newInstance)

    const { added, removed } = difference(oldReferences, newReferences)

    return removeReferences(
      addReferences(referencesToInstances, added, instanceId),
      removed,
      instanceId,
    )
  }

  return referencesToInstances
}
