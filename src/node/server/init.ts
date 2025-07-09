import { simpleGit } from "simple-git"
import type { InstancesByEntityName } from "../../shared/utils/instances.js"
import type { ModelContainer } from "../ModelContainer.js"
import type { EntityDecl } from "../schema/declarations/EntityDecl.js"
import { isEntityDecl } from "../schema/declarations/EntityDecl.js"
import { resolveTypeArgumentsInDecls } from "../schema/index.js"
import {
  attachGitStatusToInstancesByEntityName,
  getInstancesByEntityName,
} from "../utils/instances.js"
import { getReferencesToInstances } from "../utils/references.js"
import type { TSONDBRequestLocals } from "./index.js"

const getGit = async (modelContainer: ModelContainer) => {
  const git = simpleGit({ baseDir: modelContainer.dataRootPath })
  if (await git.checkIsRepo()) {
    try {
      const root = await git.revparse({ "--show-toplevel": null })
      const status = await git.status()
      return { git, root, status }
    } catch {
      return { git }
    }
  } else {
    return { git }
  }
}

export const init = async (
  modelContainer: ModelContainer,
  instancesByEntityName: InstancesByEntityName,
): Promise<TSONDBRequestLocals> => {
  const { git, root: gitRoot, status: gitStatus } = await getGit(modelContainer)

  const declarations = resolveTypeArgumentsInDecls(modelContainer.schema.declarations)
  const entities = declarations.filter(isEntityDecl)

  const entitiesByName = Object.fromEntries(
    entities.map(entity => [entity.name, entity]),
  ) as Record<string, EntityDecl>

  const instancesByEntityNameInMemory = Object.assign({}, instancesByEntityName)

  const referencesToInstances = getReferencesToInstances(instancesByEntityName, entitiesByName)

  if (gitStatus) {
    attachGitStatusToInstancesByEntityName(
      instancesByEntityName,
      modelContainer.dataRootPath,
      gitRoot,
      gitStatus,
    )
  }

  const requestLocals: TSONDBRequestLocals = {
    git: git,
    gitRoot: gitRoot,
    dataRoot: modelContainer.dataRootPath,
    declarations: declarations,
    entities: entities,
    instancesByEntityName: instancesByEntityNameInMemory,
    entitiesByName: entitiesByName,
    localeEntity: modelContainer.schema.localeEntity,
    referencesToInstances,
  }

  return requestLocals
}

export const reinit = async (locals: TSONDBRequestLocals) => {
  const gitStatus = (await locals.git.checkIsRepo()) ? await locals.git.status() : undefined
  const instancesByEntityName = await getInstancesByEntityName(locals.dataRoot, locals.entities)
  const referencesToInstances = getReferencesToInstances(
    instancesByEntityName,
    locals.entitiesByName,
  )
  if (locals.gitRoot && gitStatus) {
    attachGitStatusToInstancesByEntityName(
      instancesByEntityName,
      locals.dataRoot,
      locals.gitRoot,
      gitStatus,
    )
  }

  Object.assign(locals, {
    instancesByEntityName,
    referencesToInstances,
  })
}
