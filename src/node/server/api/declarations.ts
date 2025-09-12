import Debug from "debug"
import express from "express"
import type {
  CreateInstanceOfEntityResponseBody,
  DeleteInstanceOfEntityResponseBody,
  GetAllDeclarationsResponseBody,
  GetAllInstancesOfEntityResponseBody,
  GetDeclarationResponseBody,
  GetInstanceOfEntityResponseBody,
  UpdateInstanceOfEntityResponseBody,
} from "../../../shared/api.ts"
import { getInstanceContainerOverview } from "../../../shared/utils/instances.ts"
import { isOk } from "../../../shared/utils/result.ts"
import type { Decl } from "../../schema/declarations/Declaration.ts"
import { serializeDecl } from "../../schema/declarations/Declaration.ts"
import { isEntityDecl } from "../../schema/declarations/EntityDecl.ts"
import { isEnumDecl } from "../../schema/declarations/EnumDecl.ts"
import { isTypeAliasDecl } from "../../schema/declarations/TypeAliasDecl.ts"
import { createInstance, deleteInstance, updateInstance } from "./instanceOperations.ts"

const debug = Debug("tsondb:server:api:declarations")

export const declarationsApi = express.Router()

declarationsApi.use((req, _res, next) => {
  debug(req.path)
  next()
})

declarationsApi.get("/", (req, res) => {
  let filteredEntities: readonly Decl[]

  switch (req.query["kind"]) {
    case "Entity":
      filteredEntities = req.entities
      break
    case "TypeAlias":
      filteredEntities = req.declarations.filter(isTypeAliasDecl)
      break
    case "Enum":
      filteredEntities = req.declarations.filter(isEnumDecl)
      break
    default:
      filteredEntities = req.declarations
  }

  const body: GetAllDeclarationsResponseBody = {
    declarations: filteredEntities.map(decl => ({
      declaration: serializeDecl(decl),
      instanceCount: req.instancesByEntityName[decl.name]?.length ?? 0,
    })),
    localeEntity: req.localeEntity?.name,
  }

  res.json(body)
})

declarationsApi.get("/:name", (req, res) => {
  const decl = req.declarations.find(decl => decl.name === req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  const body: GetDeclarationResponseBody = {
    declaration: serializeDecl(decl),
    instanceCount: req.instancesByEntityName[decl.name]?.length ?? 0,
    isLocaleEntity: decl === req.localeEntity,
  }

  res.json(body)
})

declarationsApi.get("/:name/instances", (req, res) => {
  const decl = req.declarations.find(decl => decl.name === req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const body: GetAllInstancesOfEntityResponseBody = {
    instances:
      req.instancesByEntityName[req.params.name]
        ?.map(instanceContainer =>
          getInstanceContainerOverview(decl, instanceContainer, req.getInstanceById, req.locales),
        )
        .toSorted((a, b) =>
          a.displayName.localeCompare(b.displayName, undefined, { numeric: true }),
        ) ?? [],
    isLocaleEntity: decl === req.localeEntity,
  }

  res.json(body)
})

declarationsApi.post("/:name/instances", async (req, res) => {
  const decl = req.declarations.find(decl => decl.name === req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const result = await createInstance(req, req.params.name, req.body, req.query["id"])

  if (isOk(result)) {
    const body: CreateInstanceOfEntityResponseBody = {
      instance: result.value,
      isLocaleEntity: decl === req.localeEntity,
    }

    res.json(body)
  } else {
    res.status(result.error[0]).send(result.error[1])
  }
})

declarationsApi.get("/:name/instances/:id", (req, res) => {
  const decl = req.declarations.find(decl => decl.name === req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const instance = req.instancesByEntityName[decl.name]?.find(
    instance => instance.id === req.params.id,
  )

  if (instance === undefined) {
    res.status(404).send(`Instance "${req.params.id}" not found`)
    return
  }

  const body: GetInstanceOfEntityResponseBody = {
    instance: instance,
    isLocaleEntity: decl === req.localeEntity,
  }

  res.json(body)
})

declarationsApi.put("/:name/instances/:id", async (req, res) => {
  const decl = req.declarations.find(decl => decl.name === req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const result = await updateInstance(req, req.params.name, req.params.id, req.body)

  if (isOk(result)) {
    const body: UpdateInstanceOfEntityResponseBody = {
      instance: result.value,
      isLocaleEntity: decl === req.localeEntity,
    }

    res.json(body)
  } else {
    res.status(result.error[0]).send(result.error[1])
  }
})

declarationsApi.delete("/:name/instances/:id", async (req, res) => {
  const decl = req.declarations.find(decl => decl.name === req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const result = await deleteInstance(req, req.params.name, req.params.id)

  if (isOk(result)) {
    const body: DeleteInstanceOfEntityResponseBody = {
      instance: result.value,
      isLocaleEntity: decl === req.localeEntity,
    }

    res.json(body)
  } else {
    res.status(result.error[0]).send(result.error[1])
  }
})
