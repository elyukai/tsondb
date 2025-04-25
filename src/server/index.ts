import Debug from "debug"
import express from "express"
import { join } from "node:path"
import { SimpleGit, simpleGit } from "simple-git"
import { ModelContainer } from "../ModelContainer.js"
import { Decl } from "../schema/declarations/Declaration.js"
import { EntityDecl, isEntityDecl } from "../schema/declarations/EntityDecl.js"
import { InstancesByEntityName } from "../shared/utils/instances.js"
import { attachGitStatusToInstancesByEntityName } from "../utils/instances.js"
import { getReferencesToInstances, ReferencesToInstances } from "../utils/references.js"
import { api } from "./api/index.js"

const debug = Debug("tsondb:server")

type ServerOptions = {
  name: string
  port: number
}

const defaultOptions: ServerOptions = {
  name: "tsondb server",
  port: 3000,
}

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

export interface TSONDBRequestLocals {
  git: SimpleGit
  gitRoot: string | undefined
  dataRoot: string
  declarations: readonly Decl[]
  entities: readonly EntityDecl[]
  instancesByEntityName: InstancesByEntityName
  entitiesByName: Record<string, EntityDecl>
  localeEntity?: EntityDecl
  referencesToInstances: ReferencesToInstances
  setReferencesToInstances: (newRefs: ReferencesToInstances) => void
}

declare global {
  namespace Express {
    export interface Request extends TSONDBRequestLocals {}
  }
}

export const createServer = async (
  modelContainer: ModelContainer,
  instancesByEntityName: InstancesByEntityName,
  options?: Partial<ServerOptions>,
): Promise<void> => {
  const { name, port } = { ...defaultOptions, ...options }

  const app = express()

  app.use(express.static(join(import.meta.dirname, "../../public")))
  app.use("/js/node_modules", express.static(join(import.meta.dirname, "../../node_modules")))
  app.use("/js/client", express.static(join(import.meta.dirname, "../../lib/client")))
  app.use("/js/shared", express.static(join(import.meta.dirname, "../../lib/shared")))
  app.use(express.json())

  const { git, root: gitRoot, status: gitStatus } = await getGit(modelContainer)

  const declarations = modelContainer.schema.declarations
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
    setReferencesToInstances: (newRefs: ReferencesToInstances) => {
      Object.assign(referencesToInstances, newRefs)
    },
  }

  app.use((req, _res, next) => {
    Object.assign(req, requestLocals)
    next()
  })

  app.use("/api", api)

  app.get(/^\/.*/, (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TSONDB</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div id="app"></div>
  <script type="importmap">
    {
      "imports": {
        "preact": "/js/node_modules/preact/dist/preact.module.js",
        "preact/hooks": "/js/node_modules/preact/hooks/dist/hooks.module.js",
        "preact/jsx-runtime": "/js/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js",
        "preact-iso": "/js/node_modules/preact-iso/src/index.js"
      }
    }
  </script>
  <script type="module" src="/js/client/index.js"></script>
</body>
</html>`)
  })

  app.listen(port, () => {
    debug(`${name} listening on http://localhost:${port}`)
  })
}
