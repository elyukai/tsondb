import Debug from "debug"
import express from "express"
import { findPackageJSON } from "node:module"
import { dirname, join } from "node:path"
import type { SimpleGit } from "simple-git"
import type { SerializedDecl } from "../../shared/schema/declarations/Declaration.ts"
import type { HomeLayoutSection } from "../config.ts"
import type { ValidationOptions } from "../index.ts"
import type { Decl } from "../schema/declarations/Declaration.ts"
import type { EntityDecl } from "../schema/declarations/EntityDecl.ts"
import type { Schema } from "../schema/Schema.ts"
import type { DatabaseInMemory } from "../utils/databaseInMemory.ts"
import type { ReferencesToInstances } from "../utils/references.ts"
import { api } from "./api/index.ts"
import { init } from "./init.ts"
import { getLocalesFromRequest } from "./utils/locales.ts"

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
  databaseInMemory: DatabaseInMemory
  entitiesByName: Record<string, EntityDecl>
  serializedDeclarationsByName: Record<string, SerializedDecl>
  localeEntity?: EntityDecl
  referencesToInstances: ReferencesToInstances
  defaultLocales: string[]
  locales: string[]
  homeLayoutSections?: HomeLayoutSection[]
  validationOptions: Partial<ValidationOptions>
  setLocal: <K extends keyof Omit<TSONDBRequestLocals, "setLocal">>(
    key: K,
    value: TSONDBRequestLocals[K],
  ) => void
}

declare global {
  namespace Express {
    export interface Request extends TSONDBRequestLocals {}
  }
}

const staticNodeModule = (moduleName: string) => {
  const pathToPackageJson = findPackageJSON(moduleName, import.meta.url)
  if (!pathToPackageJson) {
    throw new Error(`Could not find module "${moduleName}"`)
  }
  return express.static(dirname(pathToPackageJson))
}

export const createServer = async (
  schema: Schema,
  dataRootPath: string,
  databaseInMemory: DatabaseInMemory,
  defaultLocales: string[],
  homeLayoutSections?: HomeLayoutSection[],
  options?: Partial<ServerOptions>,
  validationOptions?: Partial<ValidationOptions>,
  customStylesheetPath?: string,
): Promise<void> => {
  const { port } = { ...defaultOptions, ...options }

  const app = express()

  app.use(express.static(join(import.meta.dirname, "../../../../public")))
  app.use("/js/node_modules/preact", staticNodeModule("preact"))
  app.use("/js/node_modules/@preact/signals", staticNodeModule("@preact/signals"))
  app.use("/js/node_modules/@preact/signals-core", staticNodeModule("@preact/signals-core"))
  app.use("/js/node_modules/preact-iso", staticNodeModule("preact-iso"))
  app.use("/js/client", express.static(join(import.meta.dirname, "../../../../dist/src/web")))
  app.use("/js/shared", express.static(join(import.meta.dirname, "../../../../dist/src/shared")))
  app.use(express.json())

  const requestLocals = await init(
    schema,
    dataRootPath,
    databaseInMemory,
    defaultLocales,
    validationOptions,
    homeLayoutSections,
  )

  app.use((req, _res, next) => {
    debug("%s %s", req.method, req.originalUrl)
    ;(requestLocals as TSONDBRequestLocals).setLocal = (key, value) => {
      requestLocals[key] = (req as TSONDBRequestLocals)[key] = value
    }
    Object.assign(req, requestLocals)
    req.locales = getLocalesFromRequest(req) ?? defaultLocales
    next()
  })

  app.use("/api", api)

  const importMap = JSON.stringify(
    {
      imports: {
        preact: "/js/node_modules/preact/dist/preact.module.js",
        "preact/compat": "/js/node_modules/preact/compat/dist/compat.module.js",
        "preact/debug": "/js/node_modules/preact/debug/dist/debug.module.js",
        "preact/devtools": "/js/node_modules/preact/devtools/dist/devtools.module.js",
        "preact/hooks": "/js/node_modules/preact/hooks/dist/hooks.module.js",
        "preact/jsx-runtime": "/js/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js",
        "preact-iso": "/js/node_modules/preact-iso/src/index.js",
        "@preact/signals": "/js/node_modules/@preact/signals/dist/signals.module.js",
        "@preact/signals-core": "/js/node_modules/@preact/signals-core/dist/signals-core.module.js",
      },
    },
    null,
    2,
  )

  const customStylesheetLinkHeader = customStylesheetPath
    ? `
  <link rel="stylesheet" href="/css/custom.css">`
    : ""

  if (customStylesheetPath) {
    app.use("/css/custom.css", (_req, res) => {
      res.sendFile(customStylesheetPath)
    })
  }

  app.get(/^\/.*/, (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TSONDB</title>
  <link rel="stylesheet" href="/css/styles.css">${customStylesheetLinkHeader}
  <script type="importmap">${importMap}</script>
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
