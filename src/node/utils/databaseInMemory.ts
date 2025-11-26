import child_process from "node:child_process"
import { readdir, readFile } from "node:fs/promises"
import { basename, extname, join } from "node:path"
import { platform } from "node:process"
import { promisify } from "node:util"
import { mapAsync } from "../../shared/utils/async.ts"
import {
  emptyD,
  forEachAsyncD,
  forEachD,
  fromEntriesD,
  getD,
  getMapD,
  hasD,
  mapFirstD,
  removeD,
  setD,
  sizeD,
  toEntriesD,
  toValuesD,
  type Dictionary,
} from "../../shared/utils/dictionary.ts"
import type { InstanceContainer, InstanceContent } from "../../shared/utils/instances.ts"
import type { EntityDecl } from "../schema/index.ts"

export type DatabaseInMemory = Dictionary<InstancesInMemory>

export type InstancesInMemory = Dictionary<InstanceContainer>

export const emptyDatabaseInMemory: DatabaseInMemory = emptyD

export const getInstanceFromDatabaseInMemory = (
  db: DatabaseInMemory,
  instanceId: string,
): [entityName: string, InstanceContainer] | undefined =>
  mapFirstD(db, (instances, entityName) => {
    const instance = getD(instances, instanceId)
    if (instance) {
      return [entityName, instance]
    }
    return undefined
  })

export const getInstanceOfEntityFromDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
  instanceId: string,
): InstanceContainer | undefined =>
  getMapD(db, entityName, instances => getD(instances, instanceId))

export const getInstancesOfEntityFromDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
): InstanceContainer[] => getMapD(db, entityName, toValuesD) ?? []

export const getGroupedInstancesFromDatabaseInMemory = (
  db: DatabaseInMemory,
): [entityName: string, InstanceContainer[]][] =>
  toEntriesD(db).map(([entityName, instances]) => [entityName, Object.values(instances[0])])

export const forEachInstanceOfEntityInDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
  fn: (instance: InstanceContainer) => void,
): void => {
  for (const instance of Object.values(getMapD(db, entityName, toValuesD) ?? {})) {
    fn(instance)
  }
}

export const asyncForEachInstanceOfEntityInDatabaseInMemory = async (
  db: DatabaseInMemory,
  entityName: string,
  fn: (instance: InstanceContainer) => Promise<void>,
): Promise<void> => {
  for (const instance of Object.values(getMapD(db, entityName, toValuesD) ?? {})) {
    await fn(instance)
  }
}

export const forEachInstanceInDatabaseInMemory = (
  db: DatabaseInMemory,
  fn: (entityName: string, instance: InstanceContainer) => void,
): void => {
  forEachD(db, (instances, entityName) => {
    forEachD(instances, instance => {
      fn(entityName, instance)
    })
  })
}

export const asyncForEachInstanceInDatabaseInMemory = async (
  db: DatabaseInMemory,
  fn: (entityName: string, instance: InstanceContainer) => Promise<void>,
): Promise<void> =>
  forEachAsyncD(db, (instances, entityName) =>
    forEachAsyncD(instances, instance => fn(entityName, instance)),
  )

export const countInstancesOfEntityInDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
): number => getMapD(db, entityName, sizeD) ?? 0

const exec = promisify(child_process.exec)
const ulimit = platform === "win32" ? 2048 : Number.parseInt((await exec("ulimit -n")).stdout)

export const createDatabaseInMemory = async (
  dataRoot: string,
  entities: readonly EntityDecl[],
): Promise<DatabaseInMemory> =>
  fromEntriesD(
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
        const instancesById = fromEntriesD(instances)
        return [entity.name, instancesById] as const
      },
      1,
    ),
  )

const setInstanceInMemory = (
  instances: InstancesInMemory,
  instance: InstanceContainer,
): [InstancesInMemory, oldInstance: InstanceContent | undefined] => {
  const oldInstance = getD(instances, instance.id)
  return [setD(instances, instance.id, instance), oldInstance?.content]
}

export const setInstanceInDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
  instance: InstanceContainer,
): [DatabaseInMemory, oldInstance: InstanceContent | undefined] => {
  const [entityInstances, oldInstance] = setInstanceInMemory(
    getD(db, entityName) ?? emptyD,
    instance,
  )

  return [setD(db, entityName, entityInstances), oldInstance]
}

const deleteInstanceInMemory = (
  instances: InstancesInMemory,
  instanceId: string,
): [InstancesInMemory, oldInstance: InstanceContent | undefined] => {
  if (!hasD(instances, instanceId)) {
    return [instances, undefined]
  }

  const oldInstance = getD(instances, instanceId)
  const remainingInstancesById = removeD(instances, instanceId)

  return [remainingInstancesById, oldInstance?.content]
}

export const deleteInstanceInDatabaseInMemory = (
  db: DatabaseInMemory,
  entityName: string,
  instanceId: string,
): [DatabaseInMemory, oldInstance: InstanceContent | undefined] => {
  const entityInstances = getD(db, entityName)

  if (entityInstances === undefined) {
    return [db, undefined]
  }

  const [remainingInstances, oldInstance] = deleteInstanceInMemory(entityInstances, instanceId)

  if (entityInstances === remainingInstances) {
    return [db, undefined]
  }

  if (remainingInstances[1].length === 0) {
    const remainingEntities = removeD(db, entityName)
    return [remainingEntities, oldInstance]
  }

  return [setD(db, entityName, remainingInstances), oldInstance]
}
