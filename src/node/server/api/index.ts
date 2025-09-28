import express from "express"
import type { GetWebConfigResponseBody } from "../../../shared/api.ts"
import { declarationsApi } from "./declarations.ts"
import { gitApi } from "./git.ts"
import { instancesApi } from "./instances.ts"

export const api = express.Router()

api.use("/declarations", declarationsApi)
api.use("/instances", instancesApi)
api.use("/git", gitApi)

api.get("/config", (req, res) => {
  const body: GetWebConfigResponseBody = {
    localeEntityName: req.localeEntity?.name,
    defaultLocales: req.defaultLocales,
  }

  res.json(body)
})
