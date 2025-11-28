import Debug from "debug"
import express from "express"
import type { SearchResponseBody } from "../../../shared/api.ts"
import type { InstanceContainerOverview } from "../../../shared/utils/instances.ts"
import { isEntityDeclWithParentReference } from "../../schema/index.ts"
import { getGroupedInstancesFromDatabaseInMemory } from "../../utils/databaseInMemory.ts"
import { getDisplayNameFromEntityInstance } from "../../utils/displayName.ts"
import { createChildInstancesForInstanceIdGetter } from "../utils/childInstances.ts"
import { getQueryParamString } from "../utils/query.ts"

const debug = Debug("tsondb:server:api:search")

export const searchApi = express.Router()

searchApi.get("/", (req, res) => {
  const query = getQueryParamString(req.query, "q") ?? ""
  debug('search for items containing "%s"', query)
  const getChildInstancesForInstanceId = createChildInstancesForInstanceIdGetter(req)

  const body: SearchResponseBody = {
    query,
    results:
      query.length === 0
        ? []
        : getGroupedInstancesFromDatabaseInMemory(req.databaseInMemory)
            .flatMap(([entityName, instances]) => {
              const entity = req.entitiesByName[entityName]
              if (entity && isEntityDeclWithParentReference(entity)) {
                return []
              }
              return instances
                .map((instance): [string, InstanceContainerOverview & { relevance: number }] => {
                  const { name, localeId } = getDisplayNameFromEntityInstance(
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    req.entitiesByName[entityName]!,
                    instance,
                    req.getInstanceById,
                    getChildInstancesForInstanceId,
                    req.locales,
                  )
                  const searchableName = name.toLowerCase()
                  return [
                    entityName,
                    {
                      id: instance.id,
                      displayName: name,
                      displayNameLocaleId: localeId,
                      relevance:
                        instance.id.startsWith(query) || searchableName.startsWith(query)
                          ? 1
                          : instance.id.includes(query) || searchableName.includes(query)
                            ? 0.5
                            : 0,
                    },
                  ]
                })
                .filter(instance => instance[1].relevance > 0)
            })
            .toSorted(
              (a, b) =>
                a[1].relevance - b[1].relevance ||
                a[1].displayName.localeCompare(b[1].displayName, a[1].displayNameLocaleId),
            ),
  }

  res.json(body)
})
