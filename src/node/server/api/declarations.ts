import { assertExhaustive } from "@elyukai/utils/typeSafety"
import Debug from "debug"
import express from "express"
import type * as API from "../../../shared/api.ts"
import { NodeKind } from "../../../shared/schema/Node.ts"
import { isEntityDecl } from "../../schema/dsl/declarations/EntityDecl.ts"
import { isEnumDecl } from "../../schema/dsl/declarations/EnumDecl.ts"
import { isTypeAliasDecl } from "../../schema/dsl/declarations/TypeAliasDecl.ts"
import { isSingletonEntityDecl } from "../../schema/guards.ts"
import { serializeNode } from "../../schema/treeOperations/serialization.ts"
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
  switch (req.query["kind"]) {
    case "Entity": {
      const body: API.GetAllEntityDeclarationsResponseBody = {
        declarations: req.db.schema.resolvedEntities.map(decl => ({
          declaration: serializeNode(decl),
          instanceCount: req.db.countInstancesOfEntity(decl.name),
        })),
        localeEntity: req.db.schema.localeEntity?.name,
      }
      res.json(body)
      break
    }
    case "SingletonEntity": {
      const body: API.GetAllSingletonEntityDeclarationsResponseBody = {
        declarations: req.db.schema.resolvedSingletonEntities.map(decl => ({
          declaration: serializeNode(decl),
          hasInstance: req.db.hasInstanceOfSingletonEntity(decl.name),
        })),
      }
      res.json(body)
      break
    }
    case "TypeAlias": {
      const body: API.GetAllDeclarationsResponseBody = {
        declarations: req.db.schema.resolvedDeclarations.filter(isTypeAliasDecl).map(decl => ({
          declaration: serializeNode(decl),
        })),
        localeEntity: req.db.schema.localeEntity?.name,
      }
      res.json(body)
      break
    }
    case "Enum": {
      const body: API.GetAllDeclarationsResponseBody = {
        declarations: req.db.schema.resolvedDeclarations.filter(isEnumDecl).map(decl => ({
          declaration: serializeNode(decl),
        })),
        localeEntity: req.db.schema.localeEntity?.name,
      }
      res.json(body)
      break
    }
    default: {
      const body: API.GetAllDeclarationsResponseBody = {
        declarations: req.db.schema.resolvedDeclarations.map(decl => ({
          declaration: serializeNode(decl),
        })),
        localeEntity: req.db.schema.localeEntity?.name,
      }
      res.json(body)
    }
  }
})

declarationsApi.get("/:name", (req, res) => {
  const decl = req.db.schema.getResolvedDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  switch (decl.kind) {
    case NodeKind.EntityDecl: {
      const body: API.GetEntityDeclarationResponseBody = {
        declaration: serializeNode(decl),
        instanceCount: req.db.countInstancesOfEntity(decl.name),
        isLocaleEntity: decl === req.db.schema.localeEntity,
      }

      res.json(body)
      break
    }
    case NodeKind.SingletonEntityDecl: {
      const body: API.GetSingletonEntityDeclarationResponseBody = {
        declaration: serializeNode(decl),
        hasInstance: req.db.hasInstanceOfSingletonEntity(decl.name),
      }

      res.json(body)
      break
    }
    case NodeKind.TypeAliasDecl:
    case NodeKind.EnumDecl: {
      const body: API.GetDeclarationResponseBody = {
        declaration: serializeNode(decl),
      }

      res.json(body)
      break
    }
    default: {
      return assertExhaustive(decl)
    }
  }
})

declarationsApi.get("/:name/instances", (req, res) => {
  const decl = req.db.schema.getResolvedDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const body: API.GetAllInstancesOfEntityResponseBody = {
    instances: req.db.getAllInstanceOverviewsOfEntity(decl.name),
    isLocaleEntity: decl === req.db.schema.localeEntity,
  }

  res.json(body)
})

declarationsApi.post("/:name/instances", async (req, res) => {
  const decl = req.db.schema.getResolvedDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const requestBody = req.body as API.CreateInstanceOfEntityRequestBody
  const reqParamId = req.query["id"]
  const safeParamId = typeof reqParamId === "string" ? reqParamId : undefined

  try {
    const result = await createInstance(req.db, requestBody.instance, safeParamId)

    const body: API.CreateInstanceOfEntityResponseBody = {
      instance: result,
      isLocaleEntity: decl === req.db.schema.localeEntity,
    }

    res.json(body)
  } catch (err) {
    sendErrorResponse(res, err)
  }
})

declarationsApi.get("/:name/instances/:id", (req, res) => {
  const decl = req.db.schema.getResolvedDeclaration(req.params.name)

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

  const body: API.GetInstanceOfEntityResponseBody = {
    instance: instance,
    isLocaleEntity: decl === req.db.schema.localeEntity,
  }

  res.json(body)
})

declarationsApi.put("/:name/instances/:id", async (req, res) => {
  const decl = req.db.schema.getResolvedDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const requestBody = req.body as API.UpdateInstanceOfEntityRequestBody

  try {
    const result = await updateInstance(req.db, requestBody.instance)

    const body: API.UpdateInstanceOfEntityResponseBody = {
      instance: result,
      isLocaleEntity: decl === req.db.schema.localeEntity,
    }

    res.json(body)
  } catch (err) {
    sendErrorResponse(res, err)
  }
})

declarationsApi.delete("/:name/instances/:id", async (req, res) => {
  const decl = req.db.schema.getResolvedDeclaration(req.params.name)

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

    const body: API.DeleteInstanceOfEntityResponseBody = {
      instance: result,
      isLocaleEntity: decl === req.db.schema.localeEntity,
    }

    res.json(body)
  } catch (err) {
    sendErrorResponse(res, err)
  }
})

declarationsApi.get("/:name/instances/:id/children", (req, res) => {
  const decl = req.db.schema.getResolvedDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const body: API.GetAllChildInstancesOfInstanceResponseBody = {
    instances: getChildInstances(req.db, decl, req.params.id),
  }

  res.json(body)
})

declarationsApi.get("/:name/instance", (req, res) => {
  const decl = req.db.schema.getResolvedDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isSingletonEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not a singleton entity`)
    return
  }

  const instance = req.db.getSingletonInstanceContainerOfEntity(decl.name)

  if (instance === undefined) {
    res.status(404).send(`Singleton instance of entity ${decl.name} not found`)
    return
  }

  const body: API.GetSingletonInstanceOfEntityResponseBody = {
    instance: instance,
  }

  res.json(body)
})

declarationsApi.post("/:name/instance", async (req, res) => {
  const decl = req.db.schema.getResolvedDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isSingletonEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not a singleton entity`)
    return
  }

  const requestBody = req.body as API.CreateSingletonInstanceOfEntityRequestBody

  try {
    const result = await req.db.createSingletonInstance(
      requestBody.instance.entityName,
      requestBody.instance.content,
    )

    const body: API.CreateSingletonInstanceOfEntityResponseBody = {
      instance: result,
    }

    res.json(body)
  } catch (err) {
    sendErrorResponse(res, err)
  }
})

declarationsApi.put("/:name/instance", async (req, res) => {
  const decl = req.db.schema.getResolvedDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isSingletonEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not a singleton entity`)
    return
  }

  const requestBody = req.body as API.UpdateSingletonInstanceOfEntityRequestBody

  try {
    const result = await req.db.updateSingletonInstance(
      requestBody.instance.entityName,
      requestBody.instance.content,
    )

    const body: API.UpdateSingletonInstanceOfEntityResponseBody = {
      instance: result,
    }

    res.json(body)
  } catch (err) {
    sendErrorResponse(res, err)
  }
})

declarationsApi.delete("/:name/instance", async (req, res) => {
  const decl = req.db.schema.getResolvedDeclaration(req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isSingletonEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not a singleton entity`)
    return
  }

  try {
    const result = await req.db.deleteSingletonInstance(req.params.name)

    const body: API.DeleteSingletonInstanceOfEntityResponseBody = {
      instance: { content: result },
    }

    res.json(body)
  } catch (err) {
    sendErrorResponse(res, err)
  }
})
