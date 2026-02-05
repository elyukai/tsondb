import { mapAsync } from "@elyukai/utils/async"
import { Dictionary } from "@elyukai/utils/dictionary"
import { deepEqual } from "@elyukai/utils/equality"
import { Lazy } from "@elyukai/utils/lazy"
import child_process from "node:child_process"
import { readdir, readFile } from "node:fs/promises"
import { basename, extname, join } from "node:path"
import { platform } from "node:process"
import { promisify } from "node:util"
import type { InstanceContainer, InstanceContent } from "../../shared/utils/instances.ts"
import type { EntityDecl } from "../schema/dsl/index.ts"
import {
  normalizedIdArgs,
  type AnyChildEntityMap,
  type AnyEntityMap,
  type GetEntityByName,
  type IdArgsVariant,
  type RegisteredEntityMap,
} from "../schema/generatedTypeHelpers.ts"

type DatabaseDict<EM extends AnyEntityMap> = Dictionary<
  Dictionary<InstanceContainer>,
  Extract<keyof EM, string>
>

const exec = promisify(child_process.exec)
const ulimit = platform === "win32" ? 2048 : Number.parseInt((await exec("ulimit -n")).stdout)

export class DatabaseInMemory<EM extends AnyEntityMap = RegisteredEntityMap> {
  #data: DatabaseDict<EM>

  private constructor(data: Dictionary<Dictionary<InstanceContainer>, Extract<keyof EM, string>>) {
    this.#data = data
  }

  static async load<EM extends AnyEntityMap = RegisteredEntityMap>(
    dataRoot: string,
    entities: readonly EntityDecl<Extract<keyof EM, string>>[],
  ): Promise<DatabaseInMemory<EM>> {
    return new DatabaseInMemory(
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
      ),
    )
  }

  getAllInstanceContainersOfEntity<E extends Extract<keyof EM, string>>(
    entityName: E,
  ): InstanceContainer<EM[E]>[] {
    return (
      this.#data.getMap(
        entityName,
        instances => instances.values() as InstanceContainer<EM[E]>[],
      ) ?? []
    )
  }

  getAllInstancesOfEntity<E extends Extract<keyof EM, string>>(entityName: E): EM[E][] {
    return this.getAllInstanceContainersOfEntity(entityName).map(container => container.content)
  }

  getAllInstances(): [entityName: Extract<keyof EM, string>, instances: InstanceContainer[]][] {
    return this.#data.entries().map(([entityName, instances]) => [entityName, instances.values()])
  }

  getInstanceContainerOfEntityById<E extends Extract<keyof EM, string>>(
    ...args: IdArgsVariant<EM, E>
  ): InstanceContainer<EM[E]> | undefined {
    const { entityName, id } = normalizedIdArgs(args)
    return this.#data.getMap(
      entityName,
      instances => instances.get(id) as InstanceContainer<EM[E]> | undefined,
    )
  }

  getInstanceOfEntityById<E extends Extract<keyof EM, string>>(
    ...args: IdArgsVariant<EM, E>
  ): EM[E] | undefined {
    return this.getInstanceContainerOfEntityById(...args)?.content
  }

  hasInstanceOfEntityById<E extends Extract<keyof EM, string>>(
    ...args: IdArgsVariant<EM, E>
  ): boolean {
    const { entityName, id } = normalizedIdArgs(args)
    return this.#data.getMap(entityName, instances => instances.has(id)) ?? false
  }

  forEachInstance(
    fn: (entityName: Extract<keyof EM, string>, instance: InstanceContainer) => Promise<void>,
    async: true,
  ): Promise<void>
  forEachInstance(
    fn: (entityName: Extract<keyof EM, string>, instance: InstanceContainer) => void,
    async?: false,
  ): void
  forEachInstance(
    ...args:
      | [
          fn: (entityName: Extract<keyof EM, string>, instance: InstanceContainer) => Promise<void>,
          async: true,
        ]
      | [
          fn: (entityName: Extract<keyof EM, string>, instance: InstanceContainer) => void,
          async?: false,
        ]
  ): void | Promise<void> {
    const [fn, async] = args
    if (async) {
      return this.#data.forEach(
        (instances, entityName) => instances.forEach(instance => fn(entityName, instance), true),
        true,
      )
    } else {
      this.#data.forEach((instances, entityName) => {
        instances.forEach(instance => {
          fn(entityName, instance)
        })
      })
    }
  }

  countInstancesOfEntity(entityName: Extract<keyof EM, string>): number {
    return this.#data.getMap(entityName, instances => instances.size) ?? 0
  }

  #totalSize = Lazy.of(() => this.#data.reduce((total, instances) => total + instances.size, 0))

  get totalSize(): number {
    return this.#totalSize.value
  }

  getAllChildInstanceContainersForParent = <
    CEM extends AnyChildEntityMap,
    CE extends Extract<keyof CEM, string>,
  >(
    getEntityByName: GetEntityByName<EM>,
    childEntityName: CE,
    parentId: CEM[CE][2],
  ): InstanceContainer<CEM[CE][0]>[] => {
    const entity = getEntityByName(childEntityName as Extract<keyof EM, string>)

    if (!entity || !entity.parentReferenceKey) {
      return []
    }

    const parentKey = entity.parentReferenceKey

    return this.getAllInstanceContainersOfEntity(
      childEntityName as Extract<keyof EM, string>,
    ).filter(instance =>
      deepEqual((instance.content as { [K in typeof parentKey]: unknown })[parentKey], parentId),
    )
  }

  getAllChildInstancesForParent = <
    CEM extends AnyChildEntityMap,
    CE extends Extract<keyof CEM, string>,
  >(
    getEntityByName: GetEntityByName<EM>,
    childEntityName: CE,
    parentId: CEM[CE][2],
  ): CEM[CE][0][] => {
    return this.getAllChildInstanceContainersForParent(
      getEntityByName,
      childEntityName,
      parentId,
    ).map(container => container.content)
  }

  setInstanceContainerOfEntityById(
    entityName: Extract<keyof EM, string>,
    instance: InstanceContainer,
  ): [DatabaseInMemory<EM>, oldInstance: InstanceContent | undefined] {
    const instances: Dictionary<InstanceContainer> = this.#data.get(entityName) ?? Dictionary.empty
    return [
      new DatabaseInMemory(this.#data.set(entityName, instances.set(instance.id, instance))),
      instances.get(instance.id),
    ]
  }

  deleteInstanceContainerOfEntityById(
    entityName: Extract<keyof EM, string>,
    instanceId: string,
  ): [DatabaseInMemory<EM>, oldInstance: InstanceContent | undefined] {
    const instances: Dictionary<InstanceContainer> = this.#data.get(entityName) ?? Dictionary.empty
    const oldInstance = instances.get(instanceId)
    return oldInstance
      ? [
          new DatabaseInMemory(
            this.#data.modify(entityName, instances => {
              if (instances === undefined) {
                return instances
              }
              const remainingInstances = instances.remove(instanceId)
              return remainingInstances.size === 0 ? undefined : remainingInstances
            }),
          ),
          oldInstance.content,
        ]
      : [this, undefined]
  }

  map(
    fn: (
      instances: Dictionary<InstanceContainer>,
      entityName: Extract<keyof EM, string>,
    ) => Dictionary<InstanceContainer>,
  ): DatabaseInMemory<EM> {
    return new DatabaseInMemory(this.#data.map(fn))
  }
}
