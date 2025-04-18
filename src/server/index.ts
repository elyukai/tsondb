import express from "express"
import { join } from "node:path"
import { ModelContainer } from "../ModelContainer.js"
import { EntityDecl } from "../schema/declarations/EntityDecl.js"
import { serializeDecl } from "../schema/index.js"
import { InstancesByEntityName } from "../utils/instances.js"
import { isOk } from "../utils/result.js"
import { createInstance, updateInstance } from "./instanceOperations.js"

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
  entities: EntityDecl[],
  instancesByEntityName: InstancesByEntityName,
  options?: Partial<ServerOptions>,
): void => {
  const { name, port } = { ...defaultOptions, ...options }

  const app = express()

  app.use(express.static(join(import.meta.dirname, "../../public")))
  app.use("/js/node_modules", express.static(join(import.meta.dirname, "../../node_modules")))
  app.use("/js", express.static(join(import.meta.dirname, "../../lib/client")))

  const entitiesByName = Object.fromEntries(
    entities.map(entity => [entity.name, entity]),
  ) as Record<string, EntityDecl>

  const instancesByEntityNameInMemory: InstancesByEntityName = { ...instancesByEntityName }

  app.get("/api/entities", (_req, res) => {
    res.json(entities.map(entity => serializeDecl(entity)))
  })

  app.get("/api/entities/:name", (req, res) => {
    const entity = entities.find(entity => entity.name === req.params.name)

    if (entity === undefined) {
      res.status(404).send(`Entity "${req.params.name}" not found`)
      return
    }

    res.json(serializeDecl(entity))
  })

  app.get("/api/entities/:name/instances", (req, res) => {
    res.json(instancesByEntityNameInMemory[req.params.name] ?? [])
  })

  app.post("/api/entities/:name/instances", async (req, res) => {
    const result = await createInstance(
      modelContainer,
      entitiesByName,
      instancesByEntityNameInMemory,
      req.params.name,
      JSON.parse(req.body),
      req.query["id"],
    )

    if (isOk(result)) {
      res.json(result.value)
    } else {
      res.status(result.error[0]).send(result.error[1])
    }
  })

  app.get("/api/entities/:name/instances/:id", (req, res) => {
    if (!(req.params.name in instancesByEntityNameInMemory)) {
      res.status(404).send(`Entity "${req.params.name}" not found`)
      return
    }

    const instance = instancesByEntityNameInMemory[req.params.name]!.find(
      instance => instance.id === req.params.id,
    )

    if (instance === undefined) {
      res.status(404).send(`Instance "${req.params.id}" not found`)
      return
    }

    res.json(instance)
  })

  app.put("/api/entities/:name/instances/:id", async (req, res) => {
    const result = await updateInstance(
      modelContainer,
      entitiesByName,
      instancesByEntityNameInMemory,
      req.params.name,
      req.params.id,
      JSON.parse(req.body),
    )

    if (isOk(result)) {
      res.json(result.value)
    } else {
      res.status(result.error[0]).send(result.error[1])
    }
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
  <script type="module" src="/js/index.js"></script>
</body>
</html>`)
  })

  app.listen(port, () => {
    console.log(`${name} listening on http://localhost:${port}`)
  })
}
