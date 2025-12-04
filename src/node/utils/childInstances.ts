import { createEnumCaseValue } from "../../shared/schema/declarations/EnumDecl.ts"
import type { GitFileStatus } from "../../shared/utils/git.ts"
import type { InstanceContainer, InstanceContent } from "../../shared/utils/instances.ts"
import { hasKey } from "../../shared/utils/object.ts"
import { error, isError, map, ok, type Result } from "../../shared/utils/result.ts"
import type { ValidationOptions } from "../index.ts"
import type {
  EntityDecl,
  EntityDeclWithParentReference,
} from "../schema/declarations/EntityDecl.ts"
import {
  isEntityDeclWithParentReference,
  isEnumDecl,
  isIncludeIdentifierType,
  reduceNodes,
} from "../schema/index.ts"
import { isChildEntitiesType } from "../schema/types/references/ChildEntitiesType.ts"
import {
  getInstancesOfEntityFromDatabaseInMemory,
  type DatabaseInMemory,
} from "./databaseInMemory.ts"
import type { TransactionResult } from "./databaseTransactions.ts"
import { HTTPError } from "./error.ts"
import { createInstance, deleteInstance, updateInstance } from "./instanceTransactionSteps.ts"

export interface ChildInstanceContainer {
  id?: string
  content: InstanceContent
  gitStatus?: GitFileStatus
}

export interface EntityTaggedInstanceContainer {
  entityName: string
  id: string
  content: InstanceContent
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
  content: InstanceContent
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
  databaseInMemory: DatabaseInMemory,
  parentEntity: EntityDecl,
  parentId: string,
  childEntity: EntityDeclWithParentReference,
): InstanceContainer[] =>
  getInstancesOfEntityFromDatabaseInMemory(databaseInMemory, childEntity.name).filter(
    instanceContainer =>
      hasKey(instanceContainer.content, childEntity.parentReferenceKey) &&
      isParentReferenceReferencingParent(
        instanceContainer.content[childEntity.parentReferenceKey],
        parentEntity.name,
        parentId,
      ),
  )

export const getChildInstances = (
  databaseInMemory: DatabaseInMemory,
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
      databaseInMemory,
      parentEntity,
      parentId,
      childEntity,
    ).map<EntityTaggedInstanceContainerWithChildInstances>(container => ({
      ...container,
      entityName: childEntity.name,
      childInstances: recursive
        ? getChildInstances(databaseInMemory, childEntity, container.id)
        : [],
    })),
  )
}

const prepareNewChildInstanceContent = (
  entity: EntityDecl,
  parentEntityName: string | undefined,
  parentId: string | undefined,
  content: InstanceContent,
): Result<InstanceContent, HTTPError> => {
  if (isEntityDeclWithParentReference(entity)) {
    if (parentEntityName === undefined || parentId === undefined) {
      return error(
        new HTTPError(
          400,
          `Cannot create instance of child entity "${entity.name}" without parent reference`,
        ),
      )
    }

    const parentReferenceType = entity.type.value.properties[entity.parentReferenceKey]?.type

    return ok({
      ...content,
      [entity.parentReferenceKey]:
        parentReferenceType &&
        isIncludeIdentifierType(parentReferenceType) &&
        isEnumDecl(parentReferenceType.reference)
          ? createEnumCaseValue(parentEntityName, parentId)
          : parentId,
    })
  } else {
    return ok(content)
  }
}

export const saveInstanceTree = (
  validationOptions: Partial<ValidationOptions>,
  entitiesByName: Record<string, EntityDecl>,
  parentEntityName: string | undefined,
  parentId: string | undefined,
  localeEntity: EntityDecl | undefined,
  entityName: string,
  oldInstance: EntityTaggedInstanceContainerWithChildInstances | undefined,
  newInstance: UnsafeEntityTaggedInstanceContainerWithChildInstances | undefined,
  customId: unknown,
  res: TransactionResult,
): TransactionResult<{ instanceContainer: InstanceContainer }> => {
  if (isError(res)) {
    return res
  }

  const entity = entitiesByName[entityName]

  if (entity === undefined) {
    return error(new HTTPError(400, `Unknown entity "${entityName}"`))
  }

  if (newInstance === undefined) {
    if (oldInstance === undefined) {
      // no-op
      return map(res, data => ({ ...data, instanceContainer: { id: "", content: {} } }))
    }

    // delete all child instances recursively
    const deletedRes = deleteInstance(res, entity, oldInstance.id)
    return map(
      oldInstance.childInstances.reduce(
        (resAcc: TransactionResult, oldChildInstance) =>
          saveInstanceTree(
            validationOptions,
            entitiesByName,
            oldInstance.entityName,
            oldInstance.id,
            localeEntity,
            oldChildInstance.entityName,
            oldChildInstance,
            undefined,
            undefined,
            resAcc,
          ),
        deletedRes,
      ),
      data => ({
        ...data,
        instanceContainer: { id: oldInstance.id, content: oldInstance.content },
      }),
    )
  } else {
    const preparedContent =
      newInstance.id === undefined
        ? prepareNewChildInstanceContent(entity, parentEntityName, parentId, newInstance.content)
        : ok(newInstance.content)

    if (isError(preparedContent)) {
      return preparedContent
    }

    const setRes: TransactionResult<{ instanceId: string }> =
      newInstance.id === undefined
        ? createInstance(
            validationOptions,
            res,
            localeEntity,
            entity,
            preparedContent.value,
            customId,
          )
        : map(
            updateInstance(validationOptions, res, entity, newInstance.id, preparedContent.value),
            data => ({
              ...data,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              instanceId: newInstance.id!,
            }),
          )

    if (isError(setRes)) {
      return setRes
    }

    const instanceId = setRes.value.instanceId

    const setResWithoutInfo = ok({ ...setRes.value, additionalInformation: undefined })

    return map(
      newInstance.childInstances
        .filter(newChildInstance => newChildInstance.id === undefined)
        .reduce(
          (resAcc: TransactionResult, newChildInstance) =>
            saveInstanceTree(
              validationOptions,
              entitiesByName,
              newInstance.entityName,
              instanceId,
              localeEntity,
              newChildInstance.entityName,
              undefined,
              newChildInstance,
              undefined,
              resAcc,
            ),
          oldInstance
            ? oldInstance.childInstances.reduce(
                (resAcc: TransactionResult, oldChildInstance) =>
                  saveInstanceTree(
                    validationOptions,
                    entitiesByName,
                    oldInstance.entityName,
                    instanceId,
                    localeEntity,
                    oldChildInstance.entityName,
                    oldChildInstance,
                    newInstance.childInstances.find(ci => ci.id === oldChildInstance.id),
                    undefined,
                    resAcc,
                  ),
                setResWithoutInfo,
              )
            : setResWithoutInfo,
        ),
      data => ({
        ...data,
        instanceContainer: { id: instanceId, content: preparedContent.value },
      }),
    )
  }
}
