import Debug from "debug"
import express from "express"
import { join } from "node:path"
import type { SimpleGit } from "simple-git"
import type { InstancesByEntityName } from "../../shared/utils/instances.js"
import type { Schema } from "../Schema.ts"
import type { Decl } from "../schema/declarations/Declaration.js"
import type { EntityDecl } from "../schema/declarations/EntityDecl.js"
import type { ReferencesToInstances } from "../utils/references.js"
import { api } from "./api/index.js"
import { init } from "./init.js"

const debug = Debug("tsondb:server")

export type ServerOptions = {
  port: number
}

const defaultOptions: ServerOptions = {
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
  locales: string[]
}

declare global {
  namespace Express {
    export interface Request extends TSONDBRequestLocals {}
  }
}

export const createServer = async (
  schema: Schema,
  dataRootPath: string,
  instancesByEntityName: InstancesByEntityName,
  options?: Partial<ServerOptions>,
): Promise<void> => {
  const { port } = { ...defaultOptions, ...options }

  const app = express()

  app.use(express.static(join(import.meta.dirname, "../../../public")))
  app.use("/js/node_modules", express.static(join(import.meta.dirname, "../../../node_modules")))
  app.use("/js/client", express.static(join(import.meta.dirname, "../../../lib/web")))
  app.use("/js/shared", express.static(join(import.meta.dirname, "../../../lib/shared")))
  app.use(express.json())

  const requestLocals: TSONDBRequestLocals = await init(
    schema,
    dataRootPath,
    Object.assign({}, instancesByEntityName),
  )

  app.use((req, _res, next) => {
    debug("%s %s", req.method, req.originalUrl)
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
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/js/client/index.js"></script>
</body>
</html>`)
  })

  app.listen(port, (error?: NodeJS.ErrnoException) => {
    if (error) {
      if (error.code === "EADDRINUSE") {
        debug(`port ${port.toString()} is already in use`)
      } else {
        debug("error starting server:", error)
      }
    } else {
      debug(`server listening on http://localhost:${port.toString()}`)
    }
  })
}
