import child_process from "node:child_process"
import { readdir, readFile } from "node:fs/promises"
import { basename, extname, join } from "node:path"
import { platform } from "node:process"
import { promisify } from "node:util"
import type { StatusResult } from "simple-git"
import { mapAsync } from "../../shared/utils/async.ts"
import type { InstanceContainer, InstancesByEntityName } from "../../shared/utils/instances.ts"
import type { EntityDecl } from "../schema/declarations/EntityDecl.js"
import { formatValue } from "../schema/index.ts"
import { getFileNameForId } from "./files.ts"
import { getGitFileStatusFromStatusResult } from "./git.ts"

const exec = promisify(child_process.exec)

const ulimit = platform === "win32" ? 2048 : Number.parseInt((await exec("ulimit -n")).stdout)

export const getInstancesByEntityName = async (
  dataRoot: string,
  entities: readonly EntityDecl[],
): Promise<InstancesByEntityName> =>
  Object.fromEntries(
    (
      await mapAsync(
        entities,
        async entity => {
          const entityDir = join(dataRoot, entity.name)
          const instanceFileNames = await readdir(entityDir)
          const instances = await mapAsync(
            instanceFileNames,
            async (instanceFileName): Promise<InstanceContainer> => ({
              id: basename(instanceFileName, extname(instanceFileName)),
              content: JSON.parse(
                await readFile(join(entityDir, instanceFileName), "utf-8"),
              ) as unknown,
            }),
            ulimit,
          )
          return [entity.name, instances] as const
        },
        1,
      )
    ).toSorted(([a], [b]) => a.localeCompare(b)),
  )

export const attachGitStatusToInstancesByEntityName = (
  instancesByEntityName: InstancesByEntityName,
  dataRoot: string,
  gitRoot: string,
  gitStatus: StatusResult,
): void => {
  Object.entries(instancesByEntityName).forEach(([entityName, instances]) => {
    instancesByEntityName[entityName] = instances.map(instanceContainer => ({
      ...instanceContainer,
      gitStatus: getGitFileStatusFromStatusResult(
        gitStatus,
        gitRoot,
        dataRoot,
        entityName,
        getFileNameForId(instanceContainer.id),
      ),
    }))
  })
}

export const formatInstance = (entity: EntityDecl, instanceContent: unknown) =>
  JSON.stringify(formatValue(entity.type.value, instanceContent), undefined, 2) + "\n"
