import { readdir, readFile } from "node:fs/promises"
import { basename, extname, join } from "node:path"
import { ModelContainer } from "../ModelContainer.js"
import { EntityDecl } from "../schema/declarations/EntityDecl.js"
import { InstanceContainer, InstancesByEntityName } from "../shared/utils/instances.js"

export const getInstancesByEntityName = async (
  modelContainer: ModelContainer,
  entities: EntityDecl[],
): Promise<InstancesByEntityName> =>
  Object.fromEntries(
    await Promise.all(
      entities.map(async entity => {
        const entityDir = join(modelContainer.dataRootPath, entity.name)
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
