import { deepEqual } from "../../shared/utils/compare.ts"
import type {
  InstanceContainer,
  InstanceContainerOverview,
  InstanceContent,
} from "../../shared/utils/instances.ts"
import { error, isError, mapError, ok, type Result } from "../../shared/utils/result.ts"
import type { RegisteredEntity } from "../schema/externalTypes.ts"
import type {
  GetAllChildInstancesForParent,
  GetAllInstances,
  GetInstanceById,
} from "../schema/helpers.ts"
import type { EntityDecl } from "../schema/index.ts"
import {
  getInstanceOfEntityFromDatabaseInMemory,
  getInstancesOfEntityFromDatabaseInMemory,
  type DatabaseInMemory,
} from "./databaseInMemory.ts"

/**
 * A constraint that can be defined on an entity to enforce custom validation logic.
 *
 * The constraint function receives the instance to validate and helper functions
 * to retrieve other instances from the database.
 *
 * It should return an array of strings describing the parts of the constraint
 * that were violated. If the array is empty, the instance is considered valid.
 */
export type CustomConstraint = (params: {
  instanceId: string
  instanceContent: InstanceContent
  getInstanceById: GetInstanceById
  getAllInstance: GetAllInstances
  getAllChildInstancesForParent: GetAllChildInstancesForParent
}) => string[]

/**
 * A constraint that can be defined on an entity to enforce custom validation logic.
 *
 * The constraint function receives the instance to validate and helper functions
 * to retrieve other instances from the database.
 *
 * It should return an array of strings describing the parts of the constraint
 * that were violated. If the array is empty, the instance is considered valid.
 */
export type TypedCustomConstraint<Name extends string> = (params: {
  instanceId: string
  instanceContent: RegisteredEntity<Name>
  getInstanceById: GetInstanceById
  getAllInstance: GetAllInstances
  getAllChildInstancesForParent: GetAllChildInstancesForParent
}) => string[]

/**
 * Checks all custom constraints for all provided entities and their instances.
 *
 * Returns `Ok` when no violations have been found and an `Error` with a list of
 * `AggregateError`s for each entity if there are any violations of any custom
 * constraint.
 */
export const checkCustomConstraintsForAllEntities = (
  db: DatabaseInMemory,
  entitiesByName: Record<string, EntityDecl>,
  instanceOverviewsByEntityName: Record<string, InstanceContainerOverview[]>,
): Result<void, AggregateError> => {
  const accessors: {
    getInstanceById: GetInstanceById
    getAllInstance: GetAllInstances
    getAllChildInstancesForParent: GetAllChildInstancesForParent
  } = {
    getInstanceById: (entityName, id) =>
      getInstanceOfEntityFromDatabaseInMemory(db, entityName, id)?.content,
    getAllInstance: entityName =>
      getInstancesOfEntityFromDatabaseInMemory(db, entityName).map(i => i.content),
    getAllChildInstancesForParent: (entityName, parentId) => {
      const entity = entitiesByName[entityName]
      if (!entity || !entity.parentReferenceKey) {
        return []
      }
      const parentKey = entity.parentReferenceKey

      return getInstancesOfEntityFromDatabaseInMemory(db, entityName)
        .filter(instance =>
          deepEqual(
            (instance.content as { [K in typeof parentKey]: unknown })[parentKey],
            parentId,
          ),
        )
        .map(i => i.content)
    },
  }

  return mapError(
    Object.values(entitiesByName).reduce<Result<void, AggregateError[]>>((acc, entity) => {
      const constraintFn = entity.customConstraints

      if (!constraintFn) {
        return acc
      }

      const errors = getInstancesOfEntityFromDatabaseInMemory(db, entity.name)
        .map((instance): [InstanceContainer, string[]] => [
          instance,
          constraintFn({
            ...accessors,
            instanceId: instance.id,
            instanceContent: instance.content,
          }),
        ])
        .filter(([, violations]) => violations.length > 0)
        .map(([instance, violations]) => {
          const instanceOverview = instanceOverviewsByEntityName[entity.name]?.find(
            o => o.id === instance.id,
          )
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
