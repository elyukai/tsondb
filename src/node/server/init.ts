import Debug from "debug"
import { simpleGit } from "simple-git"
import type { HomeLayoutSection } from "../config.ts"
import type { ValidationOptions } from "../index.ts"
import type { EntityDecl } from "../schema/declarations/EntityDecl.ts"
import { isEntityDecl } from "../schema/declarations/EntityDecl.ts"
import { resolveTypeArgumentsInDecls, serializeNode } from "../schema/index.ts"
import type { Schema } from "../schema/Schema.ts"
import { createDatabaseInMemory, type DatabaseInMemory } from "../utils/databaseInMemory.ts"
import { attachGitStatusToDatabaseInMemory } from "../utils/git.ts"
import { getReferencesToInstances } from "../utils/references.ts"
import type { TSONDBRequestLocals } from "./index.ts"

const debug = Debug("tsondb:server:init")

const getGit = async (dataRootPath: string) => {
  const git = simpleGit({ baseDir: dataRootPath })
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
  schema: Schema,
  dataRootPath: string,
  databaseInMemory: DatabaseInMemory,
  defaultLocales: string[],
  validationOptions: Partial<ValidationOptions> = {},
  homeLayoutSections?: HomeLayoutSection[],
): Promise<Omit<TSONDBRequestLocals, "setLocal">> => {
  const { git, root: gitRoot, status: gitStatus } = await getGit(dataRootPath)

  const declarations = resolveTypeArgumentsInDecls(schema.declarations)
  debug("resolved type arguments in declarations")

  const entities = declarations.filter(isEntityDecl)
  debug("found %d entities in declarations", entities.length)

  const entitiesByName = Object.fromEntries(
    entities.map(entity => [entity.name, entity]),
  ) as Record<string, EntityDecl>

  const serializedDeclarationsByName = Object.fromEntries(
    declarations.map(decl => [decl.name, serializeNode(decl)]),
  )

  const referencesToInstances = await getReferencesToInstances(
    databaseInMemory,
    serializedDeclarationsByName,
  )
  debug("created references cache")

  if (gitStatus) {
    databaseInMemory = attachGitStatusToDatabaseInMemory(
      databaseInMemory,
      dataRootPath,
      gitRoot,
      gitStatus,
    )
    debug("retrieved git status to instances")
  }

  const requestLocals: Omit<TSONDBRequestLocals, "setLocal"> = {
    git: git,
    gitRoot: gitRoot,
    dataRoot: dataRootPath,
    declarations: declarations,
    entities: entities,
    databaseInMemory,
    entitiesByName: entitiesByName,
    serializedDeclarationsByName,
    localeEntity: schema.localeEntity,
    referencesToInstances,
    defaultLocales,
    locales: defaultLocales,
    homeLayoutSections,
    validationOptions,
  }

  return requestLocals
}

export const reinit = async (locals: TSONDBRequestLocals) => {
  let databaseInMemory = await createDatabaseInMemory(locals.dataRoot, locals.entities)

  const gitStatus = (await locals.git.checkIsRepo()) ? await locals.git.status() : undefined

  if (locals.gitRoot && gitStatus) {
    databaseInMemory = attachGitStatusToDatabaseInMemory(
      databaseInMemory,
      locals.dataRoot,
      locals.gitRoot,
      gitStatus,
    )
  }

  locals.setLocal("databaseInMemory", databaseInMemory)
  locals.setLocal(
    "referencesToInstances",
    await getReferencesToInstances(databaseInMemory, locals.serializedDeclarationsByName),
  )
}
