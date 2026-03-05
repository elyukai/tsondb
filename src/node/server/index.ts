import Debug from "debug"
import express from "express"
import { findPackageJSON } from "node:module"
import { dirname, join } from "node:path"
import type { HomeLayoutSection } from "../config.ts"
import type { TSONDB, ValidationOptions } from "../index.ts"
import { api } from "./api/index.ts"
import { getLocalesFromRequest } from "./utils/locales.ts"

const debug = Debug("tsondb:server")

export type ServerOptions = {
  port: number
}

const defaultOptions: ServerOptions = {
  port: 3000,
}

export interface TSONDBRequestLocals {
  db: TSONDB
  defaultLocales: string[]
  locales: string[]
  homeLayoutSections?: HomeLayoutSection[]
  validationOptions: Partial<ValidationOptions>
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

export const createServer = (
  db: TSONDB,
  homeLayoutSections?: HomeLayoutSection[],
  options?: Partial<ServerOptions>,
  validationOptions?: Partial<ValidationOptions>,
  customStylesheetPath?: string,
): void => {
  const { port } = { ...defaultOptions, ...options }

  const app = express()

  app.use(express.static(join(import.meta.dirname, "../../../../public")))
  app.use("/js/node_modules/preact", staticNodeModule("preact"))
  app.use("/js/node_modules/@preact/signals", staticNodeModule("@preact/signals"))
  app.use("/js/node_modules/@preact/signals-core", staticNodeModule("@preact/signals-core"))
  app.use("/js/node_modules/preact-iso", staticNodeModule("preact-iso"))
  app.use("/js/node_modules/@elyukai/utils", staticNodeModule("@elyukai/utils"))
  app.use("/js/node_modules/@elyukai/markdown", staticNodeModule("@elyukai/markdown"))
  app.use("/js/client", express.static(join(import.meta.dirname, "../../../../dist/src/web")))
  app.use("/js/shared", express.static(join(import.meta.dirname, "../../../../dist/src/shared")))
  app.use(express.json())

  const defaultLocales = db.locales
  const requestLocals: Omit<TSONDBRequestLocals, "setLocal"> = {
    db,
    defaultLocales,
    locales: defaultLocales,
    homeLayoutSections,
    validationOptions: validationOptions ?? {},
  }

  app.use((req, _res, next) => {
    debug("%s %s", req.method, req.originalUrl)
    Object.assign(req, requestLocals)
    req.locales = getLocalesFromRequest(req) ?? req.defaultLocales
    req.db.setLocales(req.locales)
    next()
  })

  app.use("/api", api)

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
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/js/client/web.js"></script>
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
