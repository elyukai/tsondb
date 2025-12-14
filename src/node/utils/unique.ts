import {
  normalizeKeyPath,
  renderKeyPath,
  type KeyPath,
  type UniqueConstraint,
} from "../../shared/schema/declarations/EntityDecl.ts"
import { anySameIndices, flatCombine } from "../../shared/utils/array.ts"
import { deepEqual } from "../../shared/utils/compare.ts"
import type { InstanceContainer, InstanceContainerOverview } from "../../shared/utils/instances.ts"
import { error, isError, mapError, ok, type Result } from "../../shared/utils/result.ts"
import type { EntityDecl } from "../schema/index.ts"
import {
  getInstancesOfEntityFromDatabaseInMemory,
  type DatabaseInMemory,
} from "./databaseInMemory.ts"

export class UniqueConstraintError extends Error {
  readonly parts: string[]
  constructor(message: string, parts: string[]) {
    super(message)
    this.parts = parts
  }
}

const printUniqueConstraint = (constraint: UniqueConstraint, values: unknown[]) =>
  (Array.isArray(constraint) ? constraint : [constraint])
    .map((elem, i) =>
      "keyPath" in elem
        ? renderKeyPath(elem.keyPath) +
          (elem.keyPathFallback ? "|" + renderKeyPath(elem.keyPathFallback) : "")
        : renderKeyPath(elem.entityMapKeyPath) +
          "[" +
          (Array.isArray(values[i]) ? (values[i][0] as string) : "...") +
          "]." +
          (elem.keyPathInEntityMapFallback
            ? "(" +
              renderKeyPath(elem.keyPathInEntityMap) +
              "|" +
              renderKeyPath(elem.keyPathInEntityMapFallback) +
              ")"
            : renderKeyPath(elem.keyPathInEntityMap)),
    )
    .join("+")

const unsafeGetValueAtKeyPath = (value: unknown, keyPath: KeyPath): unknown => {
  let acc = value
  for (const key of normalizeKeyPath(keyPath)) {
    acc = (acc as Record<string, unknown>)[key]
  }
  return acc
}

/**
 * Checks all unique constraints for the provided entity and its instances.
 *
 * Returns `Ok` when no violations have been found and an `Error` with an
 * `AggregateError` if there are any violations of any unique constraint.
 */
export const checkUniqueConstraintsForEntity = (
  entity: EntityDecl,
  instances: InstanceContainer[],
  instanceOverviews: InstanceContainerOverview[],
): Result<void, AggregateError> => {
  const constraintErrors: [index: number, duplicates: [id: string, row: unknown[]][][]][] = []
  const constraints = entity.uniqueConstraints ?? []

  for (const [constraintIndex, constraint] of constraints.entries()) {
    const normalizedConstraint = Array.isArray(constraint) ? constraint : [constraint]

    // the index contains all instances as rows with multiple rows per instance for all possible combinations of nested entity map values
    const index = instances.flatMap(({ id, content }) =>
      flatCombine(
        normalizedConstraint.map(elem => {
          if ("keyPath" in elem) {
            return [
              unsafeGetValueAtKeyPath(content, elem.keyPath) ??
                (elem.keyPathFallback
                  ? unsafeGetValueAtKeyPath(content, elem.keyPathFallback)
                  : undefined),
            ]
          } else {
            return Object.entries(
              unsafeGetValueAtKeyPath(content, elem.entityMapKeyPath) as Record<string, unknown>,
            ).map(([nestedId, nestedContent]) => [
              nestedId,
              unsafeGetValueAtKeyPath(nestedContent, elem.keyPathInEntityMap) ??
                (elem.keyPathInEntityMapFallback
                  ? unsafeGetValueAtKeyPath(nestedContent, elem.keyPathInEntityMapFallback)
                  : undefined),
            ])
          }
        }),
      ).map((row): [id: string, row: unknown[]] => [id, row]),
    )

    const duplicates = anySameIndices(index, (a, b) => deepEqual(a[1], b[1]))

    if (duplicates.length > 0) {
      constraintErrors.push([
        constraintIndex,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Indices returned by anySameIndices must exist
        duplicates.map(duplicateSet => duplicateSet.map(rowIndex => index[rowIndex]!)),
      ])
    }
  }

  if (constraintErrors.length > 0) {
    return error(
      new AggregateError(
        constraintErrors.flatMap(([constraintIndex, constraintErrors]) =>
          constraintErrors.map(
            error =>
              new UniqueConstraintError(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- constraint must be present
                `for unique constraint ${printUniqueConstraint(constraints[constraintIndex]!, error[0]![1])}:`,
                error.map(row => {
                  const instanceOverview = instanceOverviews.find(o => o.id === row[0])
                  return instanceOverview ? `"${instanceOverview.displayName}" (${row[0]})` : row[0]
                }),
              ),
          ),
        ),
        `in entity "${entity.name}"`,
      ),
    )
  }

  return ok()
}

/**
 * Checks all unique constraints for all provided entities and their instances.
 *
 * Returns `Ok` when no violations have been found and an `Error` with a list of
 * `AggregateError`s for each entity if there are any violations of any unique
 * constraint.
 */
export const checkUniqueConstraintsForAllEntities = (
  db: DatabaseInMemory,
  entitiesByName: Record<string, EntityDecl>,
  instanceOverviewsByEntityName: Record<string, InstanceContainerOverview[]>,
): Result<void, AggregateError> =>
  mapError(
    Object.values(entitiesByName).reduce<Result<void, AggregateError[]>>((acc, entity) => {
      const resultForEntity = checkUniqueConstraintsForEntity(
        entity,
        getInstancesOfEntityFromDatabaseInMemory(db, entity.name),
        instanceOverviewsByEntityName[entity.name] ?? [],
      )

      if (isError(acc)) {
        if (isError(resultForEntity)) {
          return error([...acc.error, resultForEntity.error])
        }
        return acc
      }

      if (isError(resultForEntity)) {
        return error([resultForEntity.error])
      }

      return acc
    }, ok()),
    errors =>
      new AggregateError(
        errors.toSorted((a, b) => a.message.localeCompare(b.message)),
        "at least one unique constraint has been violated",
      ),
  )
