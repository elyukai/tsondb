import express from "express"
import type { GetWebConfigResponseBody } from "../../../shared/api.ts"
import { declarationsApi } from "./declarations.ts"
import { gitApi } from "./git.ts"
import { instancesApi } from "./instances.ts"
import { searchApi } from "./search.ts"

export const api = express.Router()

api.use("/declarations", declarationsApi)
api.use("/instances", instancesApi)
api.use("/git", gitApi)
api.use("/search", searchApi)

api.get("/config", (req, res) => {
  const body: GetWebConfigResponseBody = {
    localeEntityName: req.localeEntity?.name,
    defaultLocales: req.defaultLocales,
    homeLayoutSections: req.homeLayoutSections?.map(section => ({
      ...section,
      entities: section.entities.map(entity => entity.name),
    })),
  }

  res.json(body)
})
