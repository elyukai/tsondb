import Debug from "debug"
import express from "express"
import type { SearchResponseBody } from "../../../shared/api.ts"
import { getQueryParamString } from "../utils/query.ts"

const debug = Debug("tsondb:server:api:search")

export const searchApi = express.Router()

searchApi.get("/", (req, res) => {
  const query = getQueryParamString(req.query, "q")?.toLowerCase() ?? ""
  debug('search for items containing "%s"', query)

  const body: SearchResponseBody = {
    query,
    results: req.db.search(query),
  }

  res.json(body)
})
