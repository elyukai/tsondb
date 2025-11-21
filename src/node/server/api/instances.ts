import Debug from "debug"
import express from "express"
import type { GetAllInstancesResponseBody } from "../../../shared/api.ts"
import { getDisplayNameFromEntityInstance } from "../../utils/displayName.ts"
import { createChildInstancesForInstanceIdGetter } from "../utils/childInstances.ts"

const debug = Debug("tsondb:server:api:instances")

export const instancesApi = express.Router()

instancesApi.use((req, _res, next) => {
  debug(req.path)
  next()
})

instancesApi.get("/", (req, res) => {
  const getChildInstancesForInstanceId = createChildInstancesForInstanceIdGetter(req)

  const body: GetAllInstancesResponseBody = {
    instances: Object.fromEntries(
      Object.entries(req.instancesByEntityName)
        .filter(([entityName]) => Object.hasOwn(req.entitiesByName, entityName))
        .map(([entityName, instances]) => [
          entityName,
          instances
            .map(instance => {
              const { name, localeId } = getDisplayNameFromEntityInstance(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                req.entitiesByName[entityName]!,
                instance,
                req.getInstanceById,
                getChildInstancesForInstanceId,
                req.locales,
              )
              return {
                id: instance.id,
                name,
                displayNameLocaleId: localeId,
              }
            })
            .toSorted((a, b) => a.name.localeCompare(b.name, a.displayNameLocaleId)),
        ]),
    ),
  }

  res.json(body)
})
