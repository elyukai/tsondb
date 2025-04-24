import express from "express"
import { declarationsApi } from "./declarations.js"
import { gitApi } from "./git.js"
import { instancesApi } from "./instances.js"

export const api = express.Router()

api.use("/declarations", declarationsApi)
api.use("/instances", instancesApi)
api.use("/git", gitApi)
