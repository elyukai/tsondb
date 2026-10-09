import { readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { InstanceContent } from "../../shared/utils/instances.ts"
import type { FormatterOptions } from "../config.ts"
import type { EntityDecl, SingletonEntityDecl } from "../schema/dsl/index.ts"
import { formatValue } from "../schema/treeOperations/format.ts"

export const getFileNameForId = (id: string): string => `${id}.json`

export const getSingletonFileName = (entityName: string): string => `${entityName}.json`

export const getPathToInstance = (dataRoot: string, entityName: string, id: string): string =>
  join(dataRoot, entityName, getFileNameForId(id))

export const getPathToSingletonInstance = (dataRoot: string, entityName: string): string =>
  join(dataRoot, getSingletonFileName(entityName))

export const readInstance = (dataRoot: string, entity: EntityDecl, id: string): Promise<string> =>
  readFile(getPathToInstance(dataRoot, entity.name, id), {
    encoding: "utf-8",
  })

export const readSingletonInstance = (
  dataRoot: string,
  entity: SingletonEntityDecl,
): Promise<string> =>
  readFile(getPathToSingletonInstance(dataRoot, entity.name), {
    encoding: "utf-8",
  })

export const writeInstance = (
  dataRoot: string,
  entity: EntityDecl,
  id: string,
  instance: InstanceContent,
  formatterOptions: Partial<FormatterOptions> | undefined,
): Promise<void> =>
  writeFile(
    getPathToInstance(dataRoot, entity.name, id),
    formatInstance(entity, instance, formatterOptions),
    {
      encoding: "utf-8",
    },
  )

export const writeSingletonInstance = (
  dataRoot: string,
  entity: SingletonEntityDecl,
  instance: InstanceContent,
  formatterOptions: Partial<FormatterOptions> | undefined,
): Promise<void> =>
  writeFile(
    getPathToSingletonInstance(dataRoot, entity.name),
    formatInstance(entity, instance, formatterOptions),
    {
      encoding: "utf-8",
    },
  )

export const deleteInstance = (dataRoot: string, entityName: string, id: string): Promise<void> =>
  rm(getPathToInstance(dataRoot, entityName, id))

export const deleteSingletonInstance = (dataRoot: string, entityName: string): Promise<void> =>
  rm(getPathToSingletonInstance(dataRoot, entityName))

export const formatInstance = (
  entity: EntityDecl | SingletonEntityDecl,
  instanceContent: InstanceContent,
  options: Partial<FormatterOptions> | undefined,
): string =>
  `${JSON.stringify(formatValue(entity.type.value, instanceContent, {}, options), undefined, 2)}\n`
