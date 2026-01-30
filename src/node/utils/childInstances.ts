import { hasKey } from "@elyukai/utils/object"
import { error, isError, ok, type Result } from "@elyukai/utils/result"
import {
  createEnumCaseValue,
  ENUM_DISCRIMINATOR_KEY,
} from "../../shared/schema/declarations/EnumDecl.ts"
import type { GitFileStatus } from "../../shared/utils/git.ts"
import type { InstanceContainer, InstanceContent } from "../../shared/utils/instances.ts"
import type { TSONDB } from "../index.ts"
import type {
  EntityDecl,
  EntityDeclWithParentReference,
} from "../schema/declarations/EntityDecl.ts"
import { Case } from "../schema/helpers.ts"
import {
  isEntityDeclWithParentReference,
  isEnumDecl,
  isIncludeIdentifierType,
  isReferenceIdentifierType,
  NodeKind,
  reduceNodes,
  type Type,
} from "../schema/index.ts"
import { isChildEntitiesType } from "../schema/types/references/ChildEntitiesType.ts"
import type { Transaction } from "../transaction.ts"
import {
  getInstancesOfEntityFromDatabaseInMemory,
  type DatabaseInMemory,
} from "./databaseInMemory.ts"
import { HTTPError } from "./error.ts"

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

export interface CreatedEntityTaggedInstanceContainerWithChildInstances extends GenEntityTaggedInstanceContainerWithChildInstances<
  undefined,
  UnsafeEntityTaggedInstanceContainerWithChildInstances
> {}

export interface UpdatedEntityTaggedInstanceContainerWithChildInstances extends GenEntityTaggedInstanceContainerWithChildInstances<
  string,
  UnsafeEntityTaggedInstanceContainerWithChildInstances
> {}

export interface UnsafeEntityTaggedInstanceContainerWithChildInstances extends GenEntityTaggedInstanceContainerWithChildInstances<
  string | undefined,
  UnsafeEntityTaggedInstanceContainerWithChildInstances
> {}

export interface EntityTaggedInstanceContainerWithChildInstances extends GenEntityTaggedInstanceContainerWithChildInstances<
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
  if (typeof value === "object" && value !== null && hasKey(value, ENUM_DISCRIMINATOR_KEY)) {
    return (
      value[ENUM_DISCRIMINATOR_KEY] === parentEntityName &&
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

const getParentReferenceTypeAux = (type: Type): "single" | "enum" => {
  if (isIncludeIdentifierType(type)) {
    switch (type.reference.kind) {
      case NodeKind.EnumDecl:
        return "enum"
      case NodeKind.TypeAliasDecl:
        return getParentReferenceTypeAux(type.reference.type.value)
    }
  } else if (isReferenceIdentifierType(type)) {
    return "single"
  } else {
    // should not happen due to schema validation
    throw new Error("Invalid parent reference type")
  }
}

const getParentReferenceType = (entity: EntityDeclWithParentReference): "single" | "enum" =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked in schema validaion
  getParentReferenceTypeAux(entity.type.value.properties[entity.parentReferenceKey]!.type)

export const getChildInstances = (
  db: TSONDB,
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

  return childEntities.flatMap(childEntity => {
    const preparedParentId =
      getParentReferenceType(childEntity) === "enum" ? Case(parentEntity.name, parentId) : parentId
    return db
      .getAllChildInstanceContainersForParent(childEntity.name, preparedParentId)
      .map<EntityTaggedInstanceContainerWithChildInstances>(container => ({
        ...container,
        entityName: childEntity.name,
        childInstances: recursive
          ? getChildInstances(db, childEntity, container.id, recursive)
          : [],
      }))
  })
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
  txn: Transaction,
  getEntity: (entityName: string) => EntityDecl | undefined,
  parentEntityName: string | undefined,
  parentId: string | undefined,
  entityName: string,
  oldInstance: EntityTaggedInstanceContainerWithChildInstances | undefined,
  newInstance: UnsafeEntityTaggedInstanceContainerWithChildInstances | undefined,
  customId: string | undefined,
): [Transaction, InstanceContainer] => {
  const entity = getEntity(entityName)

  if (entity === undefined) {
    throw new HTTPError(400, `Unknown entity "${entityName}"`)
  }

  if (newInstance === undefined) {
    if (oldInstance === undefined) {
      throw new Error("No old or new instance provided")
    }

    // delete all child instances recursively
    const deletedRes = txn.deleteInstance(entity, oldInstance.id)

    return [
      oldInstance.childInstances.reduce(
        (txnAcc: Transaction, oldChildInstance) =>
          saveInstanceTree(
            txnAcc,
            getEntity,
            oldInstance.entityName,
            oldInstance.id,
            oldChildInstance.entityName,
            oldChildInstance,
            undefined,
            undefined,
          )[0],
        deletedRes[0],
      ),
      deletedRes[1],
    ]
  } else {
    const preparedContent =
      newInstance.id === undefined
        ? prepareNewChildInstanceContent(entity, parentEntityName, parentId, newInstance.content)
        : ok(newInstance.content)

    if (isError(preparedContent)) {
      throw preparedContent.error
    }

    const [nextTxn, instanceContainer] =
      newInstance.id === undefined
        ? txn.createInstance(entity, preparedContent.value, customId)
        : txn.updateInstance(entity, newInstance.id, preparedContent.value)

    return [
      newInstance.childInstances
        .filter(newChildInstance => newChildInstance.id === undefined)
        .reduce(
          (txnAcc: Transaction, newChildInstance) =>
            saveInstanceTree(
              txnAcc,
              getEntity,
              newInstance.entityName,
              instanceContainer.id,
              newChildInstance.entityName,
              undefined,
              newChildInstance,
              undefined,
            )[0],
          oldInstance
            ? oldInstance.childInstances.reduce(
                (txnAcc: Transaction, oldChildInstance) =>
                  saveInstanceTree(
                    txnAcc,
                    getEntity,
                    oldInstance.entityName,
                    instanceContainer.id,
                    oldChildInstance.entityName,
                    oldChildInstance,
                    newInstance.childInstances.find(ci => ci.id === oldChildInstance.id),
                    undefined,
                  )[0],
                nextTxn,
              )
            : nextTxn,
        ),
      instanceContainer,
    ]
  }
}
