import { isOk } from "@elyukai/utils/result"
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
import { sortBySortOrder } from "../../../shared/schema/utils/sortOrder.ts"
import { getInstanceContainerOverview } from "../../../shared/utils/instances.ts"
import type { Decl } from "../../schema/declarations/Declaration.ts"
import { isEntityDecl } from "../../schema/declarations/EntityDecl.ts"
import { isEnumDecl } from "../../schema/declarations/EnumDecl.ts"
import { isTypeAliasDecl } from "../../schema/declarations/TypeAliasDecl.ts"
import { serializeNode } from "../../schema/index.ts"
import { getChildInstances } from "../../utils/childInstances.ts"
import {
  countInstancesOfEntityInDatabaseInMemory,
  createInstanceFromDatabaseInMemoryGetter,
  getInstanceOfEntityFromDatabaseInMemory,
  getInstancesOfEntityFromDatabaseInMemory,
} from "../../utils/databaseInMemory.ts"
import { HTTPError } from "../../utils/error.ts"
import { createChildInstancesForInstanceIdGetter } from "../utils/childInstances.ts"
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
      declaration: serializeNode(decl),
      instanceCount: countInstancesOfEntityInDatabaseInMemory(req.databaseInMemory, decl.name),
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
    declaration: serializeNode(decl),
    instanceCount: countInstancesOfEntityInDatabaseInMemory(req.databaseInMemory, decl.name),
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

  const getInstanceById = createInstanceFromDatabaseInMemoryGetter(
    req.databaseInMemory,
    req.entitiesByName,
  )
  const getChildInstancesForInstanceId = createChildInstancesForInstanceIdGetter(
    req.entitiesByName,
    req.databaseInMemory,
  )

  const body: GetAllInstancesOfEntityResponseBody = {
    instances: sortBySortOrder(
      getInstancesOfEntityFromDatabaseInMemory(req.databaseInMemory, decl.name).map(
        instanceContainer => [
          instanceContainer,
          getInstanceContainerOverview(
            decl,
            instanceContainer,
            getInstanceById,
            getChildInstancesForInstanceId,
            req.locales,
          ),
        ],
      ),
      decl.sortOrder,
    ).map(arr => arr[1]),
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

  const requestBody = req.body as CreateInstanceOfEntityRequestBody
  const result = await createInstance(req, requestBody.instance, req.query["id"])

  if (isOk(result)) {
    const body: CreateInstanceOfEntityResponseBody = {
      instance: result.value,
      isLocaleEntity: decl === req.localeEntity,
    }

    res.json(body)
  } else {
    if (result.error instanceof HTTPError) {
      res.status(result.error.code).send(result.error.message)
    } else {
      res.status(500).send(result.error.message)
    }
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

  const instance = getInstanceOfEntityFromDatabaseInMemory(
    req.databaseInMemory,
    decl.name,
    req.params.id,
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

  const requestBody = req.body as UpdateInstanceOfEntityRequestBody
  const result = await updateInstance(req, requestBody.instance)

  if (isOk(result)) {
    const body: UpdateInstanceOfEntityResponseBody = {
      instance: result.value,
      isLocaleEntity: decl === req.localeEntity,
    }

    res.json(body)
  } else {
    if (result.error instanceof HTTPError) {
      res.status(result.error.code).send(result.error.message)
    } else {
      res.status(500).send(result.error.message)
    }
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
    if (result.error instanceof HTTPError) {
      res.status(result.error.code).send(result.error.message)
    } else {
      res.status(500).send(result.error.message)
    }
  }
})

declarationsApi.get("/:name/instances/:id/children", (req, res) => {
  const decl = req.declarations.find(decl => decl.name === req.params.name)

  if (decl === undefined) {
    res.status(404).send(`Declaration "${req.params.name}" not found`)
    return
  }

  if (!isEntityDecl(decl)) {
    res.status(400).send(`Declaration "${decl.name}" is not an entity`)
    return
  }

  const body: GetAllChildInstancesOfInstanceResponseBody = {
    instances: getChildInstances(req.databaseInMemory, decl, req.params.id),
  }

  res.json(body)
})
