import { error, isError, mapError, ok, type Result } from "@elyukai/utils/result"
import type { InstanceContainer, InstanceContent } from "../../shared/utils/instances.ts"
import type { DefaultTSONDBTypes, EntityName } from "../index.ts"
import { type EntityDecl } from "../schema/dsl/index.ts"
import type {
  AnyChildEntityMap,
  AnyEntityMap,
  GetAllChildInstanceContainersForParent,
  GetAllInstances,
  GetDisplayName,
  GetDisplayNameAndId,
  GetEntityByName,
  GetInstanceById,
  GetInstanceOverviewOfEntityById,
  RegisteredChildEntityMap,
  RegisteredEntity,
  RegisteredEntityMap,
  RegisteredEnumOrTypeAlias,
} from "../schema/generatedTypeHelpers.ts"
import { checkCustomConstraints } from "../schema/treeOperations/customConstraints.ts"
import type { DatabaseInMemory } from "./databaseInMemory.ts"

export type CustomConstraintHelpers<
  EM extends AnyEntityMap = RegisteredEntityMap,
  CEM extends AnyChildEntityMap = RegisteredChildEntityMap,
> = {
  getInstanceById: GetInstanceById<EM>
  getAllInstances: GetAllInstances<EM>
  getAllChildInstancesForParent: GetAllChildInstanceContainersForParent<CEM>
  getDisplayName: GetDisplayName<EM>
  getDisplayNameAndId: GetDisplayNameAndId<EM>
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
  data: DatabaseInMemory<T["entityMap"]>,
  entities: EntityDecl<EntityName<T>>[],
): Result<void, AggregateError> => {
  const helpers: CustomConstraintHelpers<T["entityMap"], T["childEntityMap"]> = {
    getInstanceById: data.getInstanceOfEntityById.bind(data),
    getAllInstances: data.getAllInstancesOfEntity.bind(data),
    getAllChildInstancesForParent: data.getAllChildInstanceContainersForParent.bind(
      data,
      getEntityByName,
    ),
    getDisplayName,
    getDisplayNameAndId,
  }

  return mapError(
    entities.reduce<Result<void, AggregateError[]>>((acc, entity) => {
      const errors = data
        .getAllInstanceContainersOfEntity(entity.name)
        .map((instance): [InstanceContainer, string[]] => [
          instance,
          checkCustomConstraints(entity, [instance.id, instance.content], helpers),
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
