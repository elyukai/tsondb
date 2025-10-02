import type { GitFileStatus } from "../../shared/utils/git.ts"
import type { InstanceContainer, InstancesByEntityName } from "../../shared/utils/instances.ts"
import { hasKey } from "../../shared/utils/object.ts"
import { error, isError, ok, type Result } from "../../shared/utils/result.ts"
import type {
  EntityDecl,
  EntityDeclWithParentReference,
} from "../schema/declarations/EntityDecl.ts"
import { reduceNodes } from "../schema/index.ts"
import { isChildEntitiesType } from "../schema/types/references/ChildEntitiesType.ts"
import {
  checkCreateNonLocaleInstancePossible,
  checkDeleteInstancePossible,
  checkUpdateInstancePossible,
  createNewId,
  unsafeDeleteInstance,
  unsafeWriteInstance,
} from "./instanceOperations.ts"
import { type ReferencesToInstances } from "./references.ts"

export interface ChildInstanceContainer {
  id?: string
  content: unknown
  gitStatus?: GitFileStatus
}

export interface EntityTaggedInstanceContainer {
  entityName: string
  id: string
  content: unknown
}

export interface CreatedEntityTaggedInstanceContainerWithChildInstances
  extends GenEntityTaggedInstanceContainerWithChildInstances<
    undefined,
    UnsafeEntityTaggedInstanceContainerWithChildInstances
  > {}

export interface UpdatedEntityTaggedInstanceContainerWithChildInstances
  extends GenEntityTaggedInstanceContainerWithChildInstances<
    string,
    UnsafeEntityTaggedInstanceContainerWithChildInstances
  > {}

export interface UnsafeEntityTaggedInstanceContainerWithChildInstances
  extends GenEntityTaggedInstanceContainerWithChildInstances<
    string | undefined,
    UnsafeEntityTaggedInstanceContainerWithChildInstances
  > {}

export interface EntityTaggedInstanceContainerWithChildInstances
  extends GenEntityTaggedInstanceContainerWithChildInstances<
    string,
    EntityTaggedInstanceContainerWithChildInstances
  > {}

export interface GenEntityTaggedInstanceContainerWithChildInstances<
  ID extends string | undefined,
  C,
> {
  entityName: string
  id: ID
  content: unknown
  childInstances: C[]
}

const isParentReferenceReferencingParent = (
  value: unknown,
  parentEntityName: string,
  parentId: string,
): boolean => {
  if (typeof value === "object" && value !== null && hasKey(value, "kind")) {
    return (
      value.kind === parentEntityName &&
      hasKey(value, parentEntityName) &&
      value[parentEntityName] === parentId
    )
  } else if (typeof value === "string") {
    return value === parentId
  } else {
    return false
  }
}

export const getChildInstancesFromEntity = (
  instancesByEntityName: InstancesByEntityName,
  parentEntity: EntityDecl,
  parentId: string,
  childEntity: EntityDeclWithParentReference,
): InstanceContainer[] =>
  instancesByEntityName[childEntity.name]?.filter(
    instanceContainer =>
      typeof instanceContainer.content === "object" &&
      instanceContainer.content !== null &&
      hasKey(instanceContainer.content, childEntity.parentReferenceKey) &&
      isParentReferenceReferencingParent(
        instanceContainer.content[childEntity.parentReferenceKey],
        parentEntity.name,
        parentId,
      ),
  ) ?? []

export const getChildInstances = (
  instancesByEntityName: InstancesByEntityName,
  parentEntity: EntityDecl,
  parentId: string,
  recursive: boolean = true,
): EntityTaggedInstanceContainerWithChildInstances[] => {
  const childEntities = reduceNodes<EntityDeclWithParentReference>(
    (_parentNodes, node, collectedResults) =>
      isChildEntitiesType(node) ? [...collectedResults, node.entity] : collectedResults,
    [parentEntity],
    { followIncludes: true },
  )

  return childEntities.flatMap(childEntity =>
    getChildInstancesFromEntity(
      instancesByEntityName,
      parentEntity,
      parentId,
      childEntity,
    ).map<EntityTaggedInstanceContainerWithChildInstances>(container => ({
      ...container,
      entityName: childEntity.name,
      childInstances: recursive
        ? getChildInstances(instancesByEntityName, childEntity, container.id)
        : [],
    })),
  )
}

export const checkWriteInstanceTreePossible = (
  entitiesByName: Record<string, EntityDecl>,
  instancesByEntityName: InstancesByEntityName,
  referencesToInstances: ReferencesToInstances,
  parentId: string | undefined,
  parentEntityName: string,
  oldChildInstances: EntityTaggedInstanceContainerWithChildInstances[],
  childInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[],
): Result<void, [code: number, message: string]> => {
  const parentEntity = entitiesByName[parentEntityName]

  if (parentEntity === undefined) {
    return error([400, `Unknown entity "${parentEntityName}"`])
  }

  if (parentId !== undefined) {
    // existing parent, some child instances may already exist
    for (const oldChildInstance of oldChildInstances) {
      const newChildInstance = childInstances.find(ci => ci.id === oldChildInstance.id)

      if (newChildInstance === undefined) {
        const prerequisiteCheckResult = checkDeleteInstancePossible(
          referencesToInstances,
          oldChildInstance.id,
        )

        if (isError(prerequisiteCheckResult)) {
          return prerequisiteCheckResult
        }
      } else {
        const entity = entitiesByName[newChildInstance.entityName]

        if (entity === undefined) {
          return error([400, `Unknown entity "${newChildInstance.entityName}"`])
        }

        const prerequisiteCheckResult = checkUpdateInstancePossible(
          instancesByEntityName,
          entity,
          newChildInstance.content,
        )

        if (isError(prerequisiteCheckResult)) {
          return prerequisiteCheckResult
        }
      }
    }

    for (const newChildInstance of childInstances.filter(predicate => predicate.id === undefined)) {
      const entity = entitiesByName[newChildInstance.entityName]

      if (entity === undefined) {
        return error([400, `Unknown entity "${newChildInstance.entityName}"`])
      }

      const prerequisiteCheckResult = checkCreateNonLocaleInstancePossible(
        instancesByEntityName,
        entity,
        newChildInstance.content,
      )

      if (isError(prerequisiteCheckResult)) {
        return prerequisiteCheckResult
      }
    }
  } else {
    // new parent, all child instances are new
    for (const newChildInstance of childInstances) {
      const entity = entitiesByName[newChildInstance.entityName]

      if (entity === undefined) {
        return error([400, `Unknown entity "${newChildInstance.entityName}"`])
      }

      const prerequisiteCheckResult = checkCreateNonLocaleInstancePossible(
        instancesByEntityName,
        entity,
        newChildInstance.content,
      )

      if (isError(prerequisiteCheckResult)) {
        return prerequisiteCheckResult
      }
    }
  }

  // check recursively for child instances of child instances
  for (const childInstance of childInstances) {
    const oldChildInstance = childInstance.id
      ? oldChildInstances.find(ci => ci.id === childInstance.id)
      : undefined

    const prerequisiteCheckResult = checkWriteInstanceTreePossible(
      entitiesByName,
      instancesByEntityName,
      referencesToInstances,
      childInstance.id,
      childInstance.entityName,
      oldChildInstance ? oldChildInstance.childInstances : [],
      childInstance.childInstances,
    )

    if (isError(prerequisiteCheckResult)) {
      return prerequisiteCheckResult
    }
  }

  return ok()
}

export const unsafeApplyInstanceTree = async (
  dataRoot: string,
  entitiesByName: Record<string, EntityDecl>,
  instancesByEntityName: InstancesByEntityName,
  parentId: string | undefined,
  parentEntityName: string,
  oldChildInstances: EntityTaggedInstanceContainerWithChildInstances[],
  childInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[],
): Promise<Result<void, [code: number, message: string]>> => {
  const parentEntity = entitiesByName[parentEntityName]

  if (parentEntity === undefined) {
    return error([400, `Unknown entity "${parentEntityName}"`])
  }

  if (parentId !== undefined) {
    // existing parent, some child instances may already exist
    for (const oldChildInstance of oldChildInstances) {
      const newChildInstance = childInstances.find(ci => ci.id === oldChildInstance.id)

      if (newChildInstance === undefined) {
        const oldGrandChildInstancesResult = await unsafeApplyInstanceTree(
          dataRoot,
          entitiesByName,
          instancesByEntityName,
          oldChildInstance.id,
          oldChildInstance.entityName,
          oldChildInstance.childInstances,
          [],
        )

        if (isError(oldGrandChildInstancesResult)) {
          return oldGrandChildInstancesResult
        }

        const prerequisiteCheckResult = await unsafeDeleteInstance(
          dataRoot,
          oldChildInstance.entityName,
          oldChildInstance.id,
        )

        if (isError(prerequisiteCheckResult)) {
          return prerequisiteCheckResult
        }
      } else {
        const entity = entitiesByName[newChildInstance.entityName]

        if (entity === undefined) {
          return error([400, `Unknown entity "${newChildInstance.entityName}"`])
        }

        const prerequisiteCheckResult = await unsafeWriteInstance(
          dataRoot,
          entity,
          oldChildInstance.id,
          newChildInstance.content,
        )

        if (isError(prerequisiteCheckResult)) {
          return prerequisiteCheckResult
        }
      }
    }

    for (const newChildInstance of childInstances.filter(predicate => predicate.id === undefined)) {
      const entity = entitiesByName[newChildInstance.entityName]

      if (entity === undefined) {
        return error([400, `Unknown entity "${newChildInstance.entityName}"`])
      }

      const newInstanceID = createNewId()

      const prerequisiteCheckResult = await unsafeWriteInstance(
        dataRoot,
        entity,
        newInstanceID,
        newChildInstance.content,
      )

      if (isError(prerequisiteCheckResult)) {
        return prerequisiteCheckResult
      }

      newChildInstance.id = newInstanceID
    }
  } else {
    // new parent, all child instances are new
    for (const newChildInstance of childInstances) {
      const entity = entitiesByName[newChildInstance.entityName]

      if (entity === undefined) {
        return error([400, `Unknown entity "${newChildInstance.entityName}"`])
      }

      const newInstanceID = createNewId()

      const prerequisiteCheckResult = await unsafeWriteInstance(
        dataRoot,
        entity,
        newInstanceID,
        newChildInstance.content,
      )

      if (isError(prerequisiteCheckResult)) {
        return prerequisiteCheckResult
      }

      newChildInstance.id = newInstanceID
    }
  }

  // check recursively for child instances of child instances
  for (const childInstance of childInstances) {
    const oldChildInstance = childInstance.id
      ? oldChildInstances.find(ci => ci.id === childInstance.id)
      : undefined

    const prerequisiteCheckResult = await unsafeApplyInstanceTree(
      dataRoot,
      entitiesByName,
      instancesByEntityName,
      childInstance.id,
      childInstance.entityName,
      oldChildInstance ? oldChildInstance.childInstances : [],
      childInstance.childInstances,
    )

    if (isError(prerequisiteCheckResult)) {
      return prerequisiteCheckResult
    }
  }

  return ok()
}
