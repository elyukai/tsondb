import Debug from "debug"
import express from "express"
import { join } from "node:path"
import { SimpleGit } from "simple-git"
import { ModelContainer } from "../ModelContainer.js"
import { Decl } from "../schema/declarations/Declaration.js"
import { EntityDecl } from "../schema/declarations/EntityDecl.js"
import { InstancesByEntityName } from "../shared/utils/instances.js"
import { ReferencesToInstances } from "../utils/references.js"
import { api } from "./api/index.js"
import { init } from "./init.js"

const debug = Debug("tsondb:server")

export type ServerOptions = {
  name: string
  port: number
}

const defaultOptions: ServerOptions = {
  name: "tsondb server",
  port: 3000,
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

  const requestLocals: TSONDBRequestLocals = await init(
    modelContainer,
    Object.assign({}, instancesByEntityName),
  )

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
