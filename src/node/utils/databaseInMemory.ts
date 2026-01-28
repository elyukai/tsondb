import { mapAsync } from "@elyukai/utils/async"
import { Dictionary } from "@elyukai/utils/dictionary"
import child_process from "node:child_process"
import { readdir, readFile } from "node:fs/promises"
import { basename, extname, join } from "node:path"
import { platform } from "node:process"
import { promisify } from "node:util"
import type { InstanceContainer, InstanceContent } from "../../shared/utils/instances.ts"
import type { AnyEntityMap, RegisteredEntityMap } from "../schema/externalTypes.ts"
import type { EntityDecl } from "../schema/index.ts"

export type DatabaseInMemory<EM extends AnyEntityMap = RegisteredEntityMap> = Dictionary<
  InstancesInMemory,
  Extract<keyof EM, string>
>

export type InstancesInMemory = Dictionary<InstanceContainer>

export const emptyDatabaseInMemory: DatabaseInMemory = Dictionary.empty

export const getInstanceFromDatabaseInMemory = <EM extends AnyEntityMap = RegisteredEntityMap>(
  db: DatabaseInMemory<EM>,
  instanceId: string,
): { entityName: Extract<keyof EM, string>; instance: InstanceContainer } | undefined =>
  db.mapFirst((instances, entityName) =>
    instances.getMap(instanceId, instance => ({ entityName, instance })),
  )

export const getInstanceOfEntityFromDatabaseInMemory = <
  EM extends AnyEntityMap = RegisteredEntityMap,
>(
  db: DatabaseInMemory<EM>,
  entityName: Extract<keyof EM, string>,
  instanceId: string,
): InstanceContainer | undefined => db.getMap(entityName, instances => instances.get(instanceId))

export const hasInstanceOfEntityFromDatabaseInMemory = <
  EM extends AnyEntityMap = RegisteredEntityMap,
>(
  db: DatabaseInMemory<EM>,
  entityName: Extract<keyof EM, string>,
  instanceId: string,
): boolean => db.getMap(entityName, instances => instances.has(instanceId)) ?? false

export const getInstancesOfEntityFromDatabaseInMemory = <
  EM extends AnyEntityMap = RegisteredEntityMap,
>(
  db: DatabaseInMemory<EM>,
  entityName: Extract<keyof EM, string>,
): InstanceContainer[] => db.getMap(entityName, instances => instances.values()) ?? []

export const getGroupedInstancesFromDatabaseInMemory = <
  EM extends AnyEntityMap = RegisteredEntityMap,
>(
  db: DatabaseInMemory<EM>,
): [entityName: Extract<keyof EM, string>, InstanceContainer[]][] =>
  db.entries().map(([entityName, instances]) => [entityName, instances.values()])

export const forEachInstanceOfEntityInDatabaseInMemory = <
  EM extends AnyEntityMap = RegisteredEntityMap,
>(
  db: DatabaseInMemory<EM>,
  entityName: Extract<keyof EM, string>,
  fn: (instance: InstanceContainer) => void,
): void => {
  for (const instance of Object.values(
    db.getMap(entityName, instances => instances.values()) ?? {},
  )) {
    fn(instance)
  }
}

export const asyncForEachInstanceOfEntityInDatabaseInMemory = async <
  EM extends AnyEntityMap = RegisteredEntityMap,
>(
  db: DatabaseInMemory<EM>,
  entityName: Extract<keyof EM, string>,
  fn: (instance: InstanceContainer) => Promise<void>,
): Promise<void> => {
  for (const instance of Object.values(
    db.getMap(entityName, instances => instances.values()) ?? {},
  )) {
    await fn(instance)
  }
}

export const forEachInstanceInDatabaseInMemory = <EM extends AnyEntityMap = RegisteredEntityMap>(
  db: DatabaseInMemory<EM>,
  fn: (entityName: Extract<keyof EM, string>, instance: InstanceContainer) => void,
): void => {
  db.forEach((instances, entityName) => {
    instances.forEach(instance => {
      fn(entityName, instance)
    })
  })
}

export const asyncForEachInstanceInDatabaseInMemory = async <
  EM extends AnyEntityMap = RegisteredEntityMap,
>(
  db: DatabaseInMemory<EM>,
  fn: (entityName: Extract<keyof EM, string>, instance: InstanceContainer) => Promise<void>,
): Promise<void> =>
  db.forEachAsync((instances, entityName) =>
    instances.forEachAsync(instance => fn(entityName, instance)),
  )

export const countInstancesInDatabaseInMemory = (db: DatabaseInMemory): number =>
  db.reduce((sum, instances) => sum + instances.size, 0)

export const countInstancesOfEntityInDatabaseInMemory = <
  EM extends AnyEntityMap = RegisteredEntityMap,
>(
  db: DatabaseInMemory<EM>,
  entityName: Extract<keyof EM, string>,
): number => db.getMap(entityName, instances => instances.size) ?? 0

const exec = promisify(child_process.exec)
const ulimit = platform === "win32" ? 2048 : Number.parseInt((await exec("ulimit -n")).stdout)

export const createDatabaseInMemory = async <EM extends AnyEntityMap = RegisteredEntityMap>(
  dataRoot: string,
  entities: readonly EntityDecl<Extract<keyof EM, string>>[],
): Promise<DatabaseInMemory<EM>> =>
  Dictionary.fromEntries(
    await mapAsync(
      entities,
      async (entity): Promise<[Extract<keyof EM, string>, Dictionary<InstanceContainer>]> => {
        const entityDir = join(dataRoot, entity.name)
        const instanceFileNames = await readdir(entityDir)
        const instances = await mapAsync(
          instanceFileNames,
          async (instanceFileName): Promise<[string, InstanceContainer]> => {
            const id = basename(instanceFileName, extname(instanceFileName))
            return [
              id,
              {
                id,
                content: JSON.parse(
                  await readFile(join(entityDir, instanceFileName), "utf-8"),
                ) as InstanceContent,
              },
            ]
          },
          ulimit,
        )
        const instancesById = Dictionary.fromEntries(instances)
        return [entity.name, instancesById] as const
      },
      1,
    ),
  )

const setInstanceInMemory = (
  instances: InstancesInMemory,
  instance: InstanceContainer,
): [InstancesInMemory, oldInstance: InstanceContent | undefined] => {
  const oldInstance = instances.get(instance.id)
  return [instances.set(instance.id, instance), oldInstance?.content]
}

export const setInstanceInDatabaseInMemory = <EM extends AnyEntityMap = RegisteredEntityMap>(
  db: DatabaseInMemory<EM>,
  entityName: Extract<keyof EM, string>,
  instance: InstanceContainer,
): [DatabaseInMemory<EM>, oldInstance: InstanceContent | undefined] => {
  const [entityInstances, oldInstance] = setInstanceInMemory(
    db.get(entityName) ?? Dictionary.empty,
    instance,
  )

  return [db.set(entityName, entityInstances), oldInstance]
}

const deleteInstanceInMemory = (
  instances: InstancesInMemory,
  instanceId: string,
): [InstancesInMemory, oldInstance: InstanceContent | undefined] => {
  if (!instances.has(instanceId)) {
    return [instances, undefined]
  }

  const oldInstance = instances.get(instanceId)
  const remainingInstancesById = instances.remove(instanceId)

  return [remainingInstancesById, oldInstance?.content]
}

export const deleteInstanceInDatabaseInMemory = <EM extends AnyEntityMap = RegisteredEntityMap>(
  db: DatabaseInMemory<EM>,
  entityName: Extract<keyof EM, string>,
  instanceId: string,
): [DatabaseInMemory<EM>, oldInstance: InstanceContent | undefined] => {
  const entityInstances = db.get(entityName)

  if (entityInstances === undefined) {
    return [db, undefined]
  }

  const [remainingInstances, oldInstance] = deleteInstanceInMemory(entityInstances, instanceId)

  if (entityInstances === remainingInstances) {
    return [db, undefined]
  }

  if (remainingInstances.size === 0) {
    const remainingEntities = db.remove(entityName)
    return [remainingEntities, oldInstance]
  }

  return [db.set(entityName, remainingInstances), oldInstance]
}
