import { mapAsync } from "@elyukai/utils/async"
import { Dictionary } from "@elyukai/utils/dictionary"
import child_process from "node:child_process"
import { readdir, readFile } from "node:fs/promises"
import { basename, extname, join } from "node:path"
import { platform } from "node:process"
import { promisify } from "node:util"
import type { InstanceContainer, InstanceContent } from "../../shared/utils/instances.ts"
import type { EntityDecl } from "../schema/index.ts"

export type DatabaseInMemory = Dictionary<InstancesInMemory>

export type InstancesInMemory = Dictionary<InstanceContainer>

export const emptyDatabaseInMemory: DatabaseInMemory = Dictionary.empty

export const getInstanceFromDatabaseInMemory = (
  db: DatabaseInMemory,
  instanceId: string,
): { entityName: string; instance: InstanceContainer } | undefined =>
  db.mapFirst((instances, entityName) =>
    instances.getMap(instanceId, instance => ({ entityName, instance })),
  )

export type InstanceFromDatabaseInMemoryGetter = (
  instanceId: string,
) => { entity: EntityDecl; instance: InstanceContainer } | undefined

export const createInstanceFromDatabaseInMemoryGetter =
  (
    db: DatabaseInMemory,
    entitiesByName: Record<string, EntityDecl>,
  ): InstanceFromDatabaseInMemoryGetter =>
  instanceId => {
    const res = getInstanceFromDatabaseInMemory(db, instanceId)
    if (res) {
      const { entityName, instance } = res
      const entity = entitiesByName[entityName]
      if (entity) {
        return { entity, instance }
      }
    }
    return undefined
  }

export const getInstanceOfEntityFromDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
  instanceId: string,
): InstanceContainer | undefined => db.getMap(entityName, instances => instances.get(instanceId))

export const getInstancesOfEntityFromDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
): InstanceContainer[] => db.getMap(entityName, instances => instances.values()) ?? []

export const getGroupedInstancesFromDatabaseInMemory = (
  db: DatabaseInMemory,
): [entityName: string, InstanceContainer[]][] =>
  db.entries().map(([entityName, instances]) => [entityName, instances.values()])

export const forEachInstanceOfEntityInDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
  fn: (instance: InstanceContainer) => void,
): void => {
  for (const instance of Object.values(
    db.getMap(entityName, instances => instances.values()) ?? {},
  )) {
    fn(instance)
  }
}

export const asyncForEachInstanceOfEntityInDatabaseInMemory = async (
  db: DatabaseInMemory,
  entityName: string,
  fn: (instance: InstanceContainer) => Promise<void>,
): Promise<void> => {
  for (const instance of Object.values(
    db.getMap(entityName, instances => instances.values()) ?? {},
  )) {
    await fn(instance)
  }
}

export const forEachInstanceInDatabaseInMemory = (
  db: DatabaseInMemory,
  fn: (entityName: string, instance: InstanceContainer) => void,
): void => {
  db.forEach((instances, entityName) => {
    instances.forEach(instance => {
      fn(entityName, instance)
    })
  })
}

export const asyncForEachInstanceInDatabaseInMemory = async (
  db: DatabaseInMemory,
  fn: (entityName: string, instance: InstanceContainer) => Promise<void>,
): Promise<void> =>
  db.forEachAsync((instances, entityName) =>
    instances.forEachAsync(instance => fn(entityName, instance)),
  )

export const countInstancesInDatabaseInMemory = (db: DatabaseInMemory): number =>
  db.reduce((sum, instances) => sum + instances.size, 0)

export const countInstancesOfEntityInDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
): number => db.getMap(entityName, instances => instances.size) ?? 0

const exec = promisify(child_process.exec)
const ulimit = platform === "win32" ? 2048 : Number.parseInt((await exec("ulimit -n")).stdout)

export const createDatabaseInMemory = async (
  dataRoot: string,
  entities: readonly EntityDecl[],
): Promise<DatabaseInMemory> =>
  Dictionary.fromEntries(
    await mapAsync(
      entities,
      async (entity): Promise<[string, Dictionary<InstanceContainer>]> => {
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

export const setInstanceInDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
  instance: InstanceContainer,
): [DatabaseInMemory, oldInstance: InstanceContent | undefined] => {
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

export const deleteInstanceInDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
  instanceId: string,
): [DatabaseInMemory, oldInstance: InstanceContent | undefined] => {
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
