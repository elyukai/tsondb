import { error, isError, mapError, ok, type Result } from "@elyukai/utils/result"
import { NodeKind } from "../../shared/schema/Node.ts"
import type { InstanceContainer, InstanceContent } from "../../shared/utils/instances.ts"
import type { DefaultTSONDBTypes, EntityName, SingletonEntityName } from "../index.ts"
import { type EntityDecl, type SingletonEntityDecl } from "../schema/dsl/index.ts"
import type {
  AnyChildEntityMap,
  AnyEntityMap,
  AnySingletonEntityMap,
  GetAllChildInstanceContainersForParent,
  GetAllInstanceContainers,
  GetAllInstances,
  GetDisplayName,
  GetDisplayNameAndId,
  GetEntityByName,
  GetInstanceById,
  GetInstanceOverviewOfEntityById,
  GetSingletonInstance,
  RegisteredChildEntityMap,
  RegisteredEntity,
  RegisteredEntityMap,
  RegisteredEnumOrTypeAlias,
  RegisteredSingletonEntityMap,
} from "../schema/generatedTypeHelpers.ts"
import {
  checkCustomConstraintsInEntityDecl,
  checkCustomConstraintsInSingletonEntityDecl,
} from "../schema/treeOperations/customConstraints.ts"
import type { DatabaseInMemory } from "./databaseInMemory.ts"

export type CustomConstraintHelpers<
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
  SEM extends AnySingletonEntityMap = RegisteredSingletonEntityMap,
> = {
  getInstanceById: GetInstanceById<EM>
  getAllInstances: GetAllInstances<EM>
  getAllInstanceContainers: GetAllInstanceContainers<EM>
  getAllChildInstancesForParent: GetAllChildInstanceContainersForParent<CEM>
  getDisplayName: GetDisplayName<EM>
  getDisplayNameAndId: GetDisplayNameAndId<EM>
  getSingletonInstance: GetSingletonInstance<SEM>
}

/**
 * A constraint that can be defined on an entity to enforce custom validation logic.
 *
 * The constraint function receives the instance to validate and helper functions
 * to retrieve other instances from the database.
 *
 * It should return an array of strings describing the parts of the constraint
 * that were violated. If the array is empty, the instance is considered valid.
 */
export type CustomConstraint<
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
> = (
  params: {
    instanceId: string
    instanceContent: InstanceContent
  } & CustomConstraintHelpers<EM, CEM>,
) => string[]

/**
 * A constraint that can be defined on an enum or type alias to enforce custom
 * validation logic.
 *
 * The constraint function receives the value to validate and helper functions
 * to retrieve other instances from the database.
 *
 * It should return an array of strings describing the parts of the constraint
 * that were violated. If the array is empty, the value is considered valid.
 */
export type NestedCustomConstraint<
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
> = (
  params: {
    value: unknown
  } & CustomConstraintHelpers<EM, CEM>,
) => string[]

/**
 * A constraint that can be defined on an entity to enforce custom validation logic.
 *
 * The constraint function receives the instance to validate and helper functions
 * to retrieve other instances from the database.
 *
 * It should return an array of strings describing the parts of the constraint
 * that were violated. If the array is empty, the instance is considered valid.
 */
export type TypedCustomConstraint<
  Name extends string,
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
> = (
  params: {
    instanceId: string
    instanceContent: RegisteredEntity<Name>
  } & CustomConstraintHelpers<EM, CEM>,
) => string[]

/**
 * A constraint that can be defined on an enum or type alias to enforce custom
 * validation logic.
 *
 * The constraint function receives the value to validate and helper functions
 * to retrieve other instances from the database.
 *
 * It should return an array of strings describing the parts of the constraint
 * that were violated. If the array is empty, the value is considered valid.
 */
export type TypedNestedCustomConstraint<
  Name extends string,
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
> = (
  params: {
    instanceContent: RegisteredEnumOrTypeAlias<Name>
  } & CustomConstraintHelpers<EM, CEM>,
) => string[]

const collectErrorsForEntity = <T extends DefaultTSONDBTypes>(
  data: DatabaseInMemory<T["entityMap"], T["singletonEntityMap"]>,
  entity: EntityDecl<EntityName<T>> | SingletonEntityDecl<SingletonEntityName<T>>,
  getInstanceOverviewOfEntityById: GetInstanceOverviewOfEntityById<T["entityMap"]>,
  helpers: CustomConstraintHelpers<T["entityMap"], T["childEntityMap"]>,
) => {
  switch (entity.kind) {
    case NodeKind.EntityDecl:
      return data
        .getAllInstanceContainersOfEntity(entity.name)
        .map((instance): [InstanceContainer, string[]] => [
          instance,
          checkCustomConstraintsInEntityDecl(entity, [instance.id, instance.content], helpers),
        ])
        .filter(([, violations]) => violations.length > 0)
        .map(([instance, violations]) => {
          const instanceOverview = getInstanceOverviewOfEntityById(entity.name, instance.id)
          const name = instanceOverview
            ? `"${instanceOverview.displayName}" (${instance.id})`
            : instance.id
          return new AggregateError(
            violations.map(violation => new Error(violation)),
            `in instance ${name}`,
          )
        })
    case NodeKind.SingletonEntityDecl: {
      const instance = data.getSingletonInstanceContainerOfEntity(entity.name)
      if (instance) {
        return checkCustomConstraintsInSingletonEntityDecl(entity, instance.content, helpers)
      } else {
        return []
      }
    }
    default:
      return []
  }
}

/**
 * Checks all custom constraints for all provided entities and their instances.
 *
 * Returns `Ok` when no violations have been found and an `Error` with a list of
 * `AggregateError`s for each entity if there are any violations of any custom
 * constraint.
 */
export const checkCustomConstraintsForAllEntities = <T extends DefaultTSONDBTypes>(
  getDisplayName: GetDisplayName<T["entityMap"]>,
  getDisplayNameAndId: GetDisplayNameAndId<T["entityMap"]>,
  getInstanceOverviewOfEntityById: GetInstanceOverviewOfEntityById<T["entityMap"]>,
  getEntityByName: GetEntityByName<T["entityMap"]>,
  data: DatabaseInMemory<T["entityMap"], T["singletonEntityMap"]>,
  entities: (EntityDecl<EntityName<T>> | SingletonEntityDecl<SingletonEntityName<T>>)[],
): Result<void, AggregateError> => {
  const helpers: CustomConstraintHelpers<
    T["entityMap"],
    T["childEntityMap"],
    T["singletonEntityMap"]
  > = {
    getInstanceById: data.getInstanceOfEntityById.bind(data),
    getAllInstances: data.getAllInstancesOfEntity.bind(data),
    getAllInstanceContainers: data.getAllInstanceContainersOfEntity.bind(data),
    getAllChildInstancesForParent: data.getAllChildInstanceContainersForParent.bind(
      data,
      getEntityByName,
    ),
    getDisplayName,
    getDisplayNameAndId,
    getSingletonInstance: data.getSingletonInstanceOfEntity.bind(data),
  }

  return mapError(
    entities.reduce<Result<void, AggregateError[]>>((acc, entity) => {
      const errors = collectErrorsForEntity(data, entity, getInstanceOverviewOfEntityById, helpers)

      const aggregate =
        errors.length > 0 ? new AggregateError(errors, `in entity "${entity.name}"`) : undefined

      if (isError(acc)) {
        if (aggregate) {
          return error([...acc.error, aggregate])
        }
        return acc
      }

      if (aggregate) {
        return error([aggregate])
      }

      return acc
    }, ok()),
    errors =>
      new AggregateError(
        errors.toSorted((a, b) => a.message.localeCompare(b.message)),
        "at least one custom constraint has been violated",
      ),
  )
}
