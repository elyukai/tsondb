import Debug from "debug"
import express from "express"
import type { GetAllInstancesResponseBody } from "../../../shared/api.ts"

const debug = Debug("tsondb:server:api:instances")

export const instancesApi = express.Router()

instancesApi.use((req, _res, next) => {
  debug(req.path)
  next()
})

instancesApi.get("/", (req, res) => {
  const body: GetAllInstancesResponseBody = {
    instances: req.db.getAllInstanceOverviews(),
  }

  res.json(body)
})
