import Debug from "debug"
import express from "express"
import { serializeEntityDecl } from "../../schema/declarations/EntityDecl.js"
import { GetAllInstancesResponseBody } from "../../shared/api.js"
import { getDisplayNameFromEntityInstance } from "../../shared/utils/displayName.js"

const debug = Debug("tsondb:server:api:instances")

export const instancesApi = express.Router()

instancesApi.use((req, _res, next) => {
  debug(req.path)
  next()
})

instancesApi.get("/", (req, res) => {
  const locales = (
    Array.isArray(req.query["locales"]) ? req.query["locales"] : [req.query["locales"]]
  ).filter(locale => typeof locale === "string")

  const body: GetAllInstancesResponseBody = {
    instances: Object.fromEntries(
      Object.entries(req.instancesByEntityName).map(([entityName, instances]) => [
        entityName,
        instances.map(instance => ({
          id: instance.id,
          name: getDisplayNameFromEntityInstance(
            serializeEntityDecl(req.entitiesByName[entityName]!),
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
