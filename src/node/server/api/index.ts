import express from "express"
import { declarationsApi } from "./declarations.ts"
import { gitApi } from "./git.ts"
import { instancesApi } from "./instances.ts"

export const api = express.Router()

api.use("/declarations", declarationsApi)
api.use("/instances", instancesApi)
api.use("/git", gitApi)
