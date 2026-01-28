import Debug from "debug"
import express from "express"
import type {
  CreateInstanceOfEntityRequestBody,
  CreateInstanceOfEntityResponseBody,
  DeleteInstanceOfEntityResponseBody,
  GetAllChildInstancesOfInstanceResponseBody,
  GetAllDeclarationsResponseBody,
  GetAllInstancesOfEntityResponseBody,
  GetDeclarationResponseBody,
  GetInstanceOfEntityResponseBody,
  UpdateInstanceOfEntityRequestBody,
  UpdateInstanceOfEntityResponseBody,
} from "../../../shared/api.ts"
import type { Decl } from "../../schema/declarations/Declaration.ts"
import { isEntityDecl } from "../../schema/declarations/EntityDecl.ts"
import { isEnumDecl } from "../../schema/declarations/EnumDecl.ts"
import { isTypeAliasDecl } from "../../schema/declarations/TypeAliasDecl.ts"
import { serializeNode } from "../../schema/index.ts"
import { getChildInstances } from "../../utils/childInstances.ts"
import { sendErrorResponse } from "../../utils/error.ts"
import { createInstance, deleteInstance, updateInstance } from "../utils/instanceOperations.ts"

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
      filteredEntities = req.db.schema.entities
      break
    case "TypeAlias":
      filteredEntities = req.db.schema.declarations.filter(isTypeAliasDecl)
      break
    case "Enum":
      filteredEntities = req.db.schema.declarations.filter(isEnumDecl)
      break
    default:
      filteredEntities = req.db.schema.declarations
  }

  const body: GetAllDeclarationsResponseBody = {
    declarations: filteredEntities.map(decl => ({
      declaration: serializeNode(decl),
      instanceCount: req.db.countInstancesOfEntity(decl.name),
    })),
    localeEntity: req.db.schema.localeEntity?.name,
  }

  res.json(body)
})

declarationsApi.get("/:name", (req, res) => {
  const decl = req.db.schema.getDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  const body: GetDeclarationResponseBody = {
    declaration: serializeNode(decl),
    instanceCount: req.db.countInstancesOfEntity(decl.name),
    isLocaleEntity: decl === req.db.schema.localeEntity,
  }

  res.json(body)
})

declarationsApi.get("/:name/instances", (req, res) => {
  const decl = req.db.schema.getDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const body: GetAllInstancesOfEntityResponseBody = {
    instances: req.db.getAllInstanceOverviewsOfEntity(decl.name),
    isLocaleEntity: decl === req.db.schema.localeEntity,
  }

  res.json(body)
})

declarationsApi.post("/:name/instances", async (req, res) => {
  const decl = req.db.schema.getDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const requestBody = req.body as CreateInstanceOfEntityRequestBody
  const reqParamId = req.query["id"]
  const safeParamId = typeof reqParamId === "string" ? reqParamId : undefined

  try {
    const result = await createInstance(req.db, requestBody.instance, safeParamId)

    const body: CreateInstanceOfEntityResponseBody = {
      instance: result,
      isLocaleEntity: decl === req.db.schema.localeEntity,
    }

    res.json(body)
  } catch (err) {
    sendErrorResponse(res, err)
  }
})

declarationsApi.get("/:name/instances/:id", (req, res) => {
  const decl = req.db.schema.getDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const instance = req.db.getInstanceContainerOfEntityById(decl.name, req.params.id)

  if (instance === undefined) {
    res.status(404).send(`Instance "${req.params.id}" not found`)
    return
  }

  const body: GetInstanceOfEntityResponseBody = {
    instance: instance,
    isLocaleEntity: decl === req.db.schema.localeEntity,
  }

  res.json(body)
})

declarationsApi.put("/:name/instances/:id", async (req, res) => {
  const decl = req.db.schema.getDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const requestBody = req.body as UpdateInstanceOfEntityRequestBody

  try {
    const result = await updateInstance(req.db, requestBody.instance)

    const body: UpdateInstanceOfEntityResponseBody = {
      instance: result,
      isLocaleEntity: decl === req.db.schema.localeEntity,
    }

    res.json(body)
  } catch (err) {
    sendErrorResponse(res, err)
  }
})

declarationsApi.delete("/:name/instances/:id", async (req, res) => {
  const decl = req.db.schema.getDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  try {
    const result = await deleteInstance(req.db, req.params.name, req.params.id)

    const body: DeleteInstanceOfEntityResponseBody = {
      instance: result,
      isLocaleEntity: decl === req.db.schema.localeEntity,
    }

    res.json(body)
  } catch (err) {
    sendErrorResponse(res, err)
  }
})

declarationsApi.get("/:name/instances/:id/children", (req, res) => {
  const decl = req.db.schema.getDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const body: GetAllChildInstancesOfInstanceResponseBody = {
    instances: getChildInstances(req.db, decl, req.params.id),
  }

  res.json(body)
})
