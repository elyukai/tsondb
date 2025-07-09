import { readdir, readFile } from "node:fs/promises"
import { basename, extname, join } from "node:path"
import type { StatusResult } from "simple-git"
import type { InstanceContainer, InstancesByEntityName } from "../../shared/utils/instances.js"
import type { EntityDecl } from "../schema/declarations/EntityDecl.js"
import { getGitFileStatusFromStatusResult } from "./git.js"

export const getInstancesByEntityName = async (
  dataRoot: string,
  entities: readonly EntityDecl[],
): Promise<InstancesByEntityName> =>
  Object.fromEntries(
    await Promise.all(
      entities.map(async entity => {
        const entityDir = join(dataRoot, entity.name)
        const instanceFileNames = await readdir(entityDir)
        const instances = await Promise.all(
          instanceFileNames.map(
            async (instanceFileName): Promise<InstanceContainer> => ({
              fileName: instanceFileName,
              id: basename(instanceFileName, extname(instanceFileName)),
              content: JSON.parse(
                await readFile(join(entityDir, instanceFileName), "utf-8"),
              ) as unknown,
            }),
          ),
        )
        return [entity.name, instances] as const
      }),
    ),
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
        instanceContainer.fileName,
      ),
    }))
  })
}
