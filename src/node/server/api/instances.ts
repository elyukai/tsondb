import Debug from "debug"
import express from "express"
import type { GetAllInstancesResponseBody } from "../../../shared/api.ts"
import { getDisplayNameFromEntityInstance } from "../../utils/displayName.ts"

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
      Object.entries(req.instancesByEntityName)
        .filter(([entityName]) => Object.hasOwn(req.entitiesByName, entityName))
        .map(([entityName, instances]) => [
          entityName,
          instances.map(instance => ({
            id: instance.id,
            name: getDisplayNameFromEntityInstance(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              req.entitiesByName[entityName]!,
              instance.content,
              instance.id,
              req.getInstanceById,
              locales,
            ),
          })),
        ]),
    ),
  }

  res.json(body)
})
