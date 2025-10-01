import { rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { EntityDecl } from "../schema/index.ts"
import { formatInstance } from "./instances.ts"

export const getFileNameForId = (id: string): string => `${id}.json`

export const getPathToInstance = (dataRoot: string, entityName: string, id: string): string =>
  join(dataRoot, entityName, getFileNameForId(id))

export const writeInstance = (
  dataRoot: string,
  entity: EntityDecl,
  id: string,
  instance: unknown,
): Promise<void> =>
  writeFile(getPathToInstance(dataRoot, entity.name, id), formatInstance(entity, instance), {
    encoding: "utf-8",
  })

export const deleteInstance = (dataRoot: string, entityName: string, id: string): Promise<void> =>
  rm(getPathToInstance(dataRoot, entityName, id))
