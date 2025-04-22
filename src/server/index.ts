import express from "express"
import { join } from "node:path"
import { ModelContainer } from "../ModelContainer.js"
import { Decl, serializeDecl } from "../schema/declarations/Declaration.js"
import { EntityDecl, isEntityDecl, serializeEntityDecl } from "../schema/declarations/EntityDecl.js"
import { isEnumDecl } from "../schema/declarations/EnumDecl.js"
import { isTypeAliasDecl } from "../schema/declarations/TypeAliasDecl.js"
import {
  CreateInstanceOfEntityResponseBody,
  DeleteInstanceOfEntityResponseBody,
  GetAllDeclarationsResponseBody,
  GetAllInstancesOfEntityResponseBody,
  GetAllInstancesResponseBody,
  GetDeclarationResponseBody,
  GetInstanceOfEntityResponseBody,
  UpdateInstanceOfEntityResponseBody,
} from "../shared/api.js"
import { getDisplayNameFromEntityInstance } from "../shared/utils/displayName.js"
import { InstancesByEntityName } from "../shared/utils/instances.js"
import { isOk } from "../utils/result.js"
import { createInstance, deleteInstance, updateInstance } from "./instanceOperations.js"

type ServerOptions = {
  name: string
  port: number
}

const defaultOptions: ServerOptions = {
  name: "tsondb server",
  port: 3000,
}

export const createServer = (
  modelContainer: ModelContainer,
  instancesByEntityName: InstancesByEntityName,
  options?: Partial<ServerOptions>,
): void => {
  const { name, port } = { ...defaultOptions, ...options }

  const app = express()

  app.use(express.static(join(import.meta.dirname, "../../public")))
  app.use("/js/node_modules", express.static(join(import.meta.dirname, "../../node_modules")))
  app.use("/js/client", express.static(join(import.meta.dirname, "../../lib/client")))
  app.use("/js/shared", express.static(join(import.meta.dirname, "../../lib/shared")))
  app.use(express.json())

  const declarations = modelContainer.schema.declarations
  const entities = declarations.filter(isEntityDecl)

  const entitiesByName = Object.fromEntries(
    entities.map(entity => [entity.name, entity]),
  ) as Record<string, EntityDecl>

  const instancesByEntityNameInMemory: InstancesByEntityName = { ...instancesByEntityName }

  app.get("/api/declarations", (req, res) => {
    let filteredEntities: readonly Decl[]

    switch (req.query["kind"]) {
      case "Entity":
        filteredEntities = entities.filter(isEntityDecl)
        break
      case "TypeAlias":
        filteredEntities = entities.filter(isTypeAliasDecl)
        break
      case "Enum":
        filteredEntities = entities.filter(isEnumDecl)
        break
      default:
        filteredEntities = declarations
    }

    const body: GetAllDeclarationsResponseBody = {
      declarations: filteredEntities.map(decl => ({
        declaration: serializeDecl(decl),
        instanceCount: instancesByEntityNameInMemory[decl.name]?.length ?? 0,
      })),
      localeEntity: modelContainer.schema.localeEntity?.name,
    }

    res.json(body)
  })

  app.get("/api/declarations/:name", (req, res) => {
    const decl = declarations.find(decl => decl.name === req.params.name)

    if (decl === undefined) {
      res.status(404).send(`Declaration "${req.params.name}" not found`)
      return
    }

    const body: GetDeclarationResponseBody = {
      declaration: serializeDecl(decl),
      instanceCount: instancesByEntityNameInMemory[decl.name]?.length ?? 0,
      isLocaleEntity: decl === modelContainer.schema.localeEntity,
    }

    res.json(body)
  })

  app.get("/api/declarations/:name/instances", (req, res) => {
    const decl = declarations.find(decl => decl.name === req.params.name)

    if (decl === undefined) {
      res.status(404).send(`Declaration "${req.params.name}" not found`)
      return
    }

    if (!isEntityDecl(decl)) {
      res.status(400).send(`Declaration "${decl.name}" is not an entity`)
      return
    }

    const body: GetAllInstancesOfEntityResponseBody = {
      instances: instancesByEntityNameInMemory[req.params.name] ?? [],
      isLocaleEntity: decl === modelContainer.schema.localeEntity,
    }

    res.json(body)
  })

  app.post("/api/declarations/:name/instances", async (req, res) => {
    const decl = declarations.find(decl => decl.name === req.params.name)

    if (decl === undefined) {
      res.status(404).send(`Declaration "${req.params.name}" not found`)
      return
    }

    if (!isEntityDecl(decl)) {
      res.status(400).send(`Declaration "${decl.name}" is not an entity`)
      return
    }

    const result = await createInstance(
      modelContainer,
      entitiesByName,
      instancesByEntityNameInMemory,
      decl.name,
      req.body,
      req.query["id"],
    )

    if (isOk(result)) {
      const body: CreateInstanceOfEntityResponseBody = {
        instance: result.value,
        isLocaleEntity: decl === modelContainer.schema.localeEntity,
      }

      res.json(body)
    } else {
      res.status(result.error[0]).send(result.error[1])
    }
  })

  app.get("/api/declarations/:name/instances/:id", (req, res) => {
    const decl = declarations.find(decl => decl.name === req.params.name)

    if (decl === undefined) {
      res.status(404).send(`Declaration "${req.params.name}" not found`)
      return
    }

    if (!isEntityDecl(decl)) {
      res.status(400).send(`Declaration "${decl.name}" is not an entity`)
      return
    }

    const instance = instancesByEntityNameInMemory[decl.name]?.find(
      instance => instance.id === req.params.id,
    )

    if (instance === undefined) {
      res.status(404).send(`Instance "${req.params.id}" not found`)
      return
    }

    const body: GetInstanceOfEntityResponseBody = {
      instance: instance,
      isLocaleEntity: decl === modelContainer.schema.localeEntity,
    }

    res.json(body)
  })

  app.put("/api/declarations/:name/instances/:id", async (req, res) => {
    const decl = declarations.find(decl => decl.name === req.params.name)

    if (decl === undefined) {
      res.status(404).send(`Declaration "${req.params.name}" not found`)
      return
    }

    if (!isEntityDecl(decl)) {
      res.status(400).send(`Declaration "${decl.name}" is not an entity`)
      return
    }

    const result = await updateInstance(
      modelContainer,
      entitiesByName,
      instancesByEntityNameInMemory,
      decl.name,
      req.params.id,
      req.body,
    )

    if (isOk(result)) {
      const body: UpdateInstanceOfEntityResponseBody = {
        instance: result.value,
        isLocaleEntity: decl === modelContainer.schema.localeEntity,
      }

      res.json(body)
    } else {
      res.status(result.error[0]).send(result.error[1])
    }
  })

  app.delete("/api/declarations/:name/instances/:id", async (req, res) => {
    const decl = declarations.find(decl => decl.name === req.params.name)

    if (decl === undefined) {
      res.status(404).send(`Declaration "${req.params.name}" not found`)
      return
    }

    if (!isEntityDecl(decl)) {
      res.status(400).send(`Declaration "${decl.name}" is not an entity`)
      return
    }

    const result = await deleteInstance(
      modelContainer,
      instancesByEntityNameInMemory,
      decl.name,
      req.params.id,
    )

    if (isOk(result)) {
      const body: DeleteInstanceOfEntityResponseBody = {
        instance: result.value,
        isLocaleEntity: decl === modelContainer.schema.localeEntity,
      }

      res.json(body)
    } else {
      res.status(result.error[0]).send(result.error[1])
    }
  })

  app.get("/api/instances", (req, res) => {
    const locales = (
      Array.isArray(req.query["locales"]) ? req.query["locales"] : [req.query["locales"]]
    ).filter(locale => typeof locale === "string")

    const body: GetAllInstancesResponseBody = {
      instances: Object.fromEntries(
        Object.entries(instancesByEntityNameInMemory).map(([entityName, instances]) => [
          entityName,
          instances.map(instance => ({
            id: instance.id,
            name: getDisplayNameFromEntityInstance(
              serializeEntityDecl(entitiesByName[entityName]!),
              instance.content,
              instance.id,
              locales,
            ),
          })),
        ]),
      ),
    }

    res.json(body)
  })

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
    console.log(`${name} listening on http://localhost:${port}`)
  })
}
