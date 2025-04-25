import Debug from "debug"
import express from "express"
import { join } from "node:path"
import { serializeEntityDecl } from "../../schema/index.js"
import { GetAllGitBranchesResponseBody, GitStatusResponseBody } from "../../shared/api.js"
import { hasFileChanges } from "../../shared/utils/git.js"
import { getInstanceContainerOverview } from "../../shared/utils/instances.js"
import { attachGitStatusToInstancesByEntityName } from "../../utils/instances.js"
import { reinit } from "../init.js"

const debug = Debug("tsondb:server:api:git")

export const gitApi = express.Router()

gitApi.use((req, res, next) => {
  debug(req.path)
  if (req.gitRoot === undefined) {
    res.status(500).send("Git repository not found")
    return
  }

  next()
})

gitApi.get("/status", async (req, res) => {
  const locales = (
    Array.isArray(req.query["locales"]) ? req.query["locales"] : [req.query["locales"]]
  ).filter(locale => typeof locale === "string")

  const status = await req.git.status()

  attachGitStatusToInstancesByEntityName(
    req.instancesByEntityName,
    req.dataRoot,
    req.gitRoot!,
    status,
  )

  const body: GitStatusResponseBody = {
    commitsAhead: status.ahead,
    commitsBehind: status.behind,
    instances: Object.fromEntries(
      Object.entries(req.instancesByEntityName).map(([entityName, instances]) => [
        entityName,
        instances
          .filter(instance => hasFileChanges(instance.gitStatus))
          .map(instance =>
            getInstanceContainerOverview(
              serializeEntityDecl(req.entitiesByName[entityName]!),
              instance,
              locales,
            ),
          ),
      ]),
    ),
  }

  res.json(body)
})

gitApi.post("/stage", async (req, res) => {
  try {
    await req.git.add(req.dataRoot)
    res.status(200).send("Added all database files to index")
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res.status(500).send("Adding all database files to index failed")
  }
})

gitApi.post("/stage/:entityName", async (req, res) => {
  try {
    await req.git.add(join(req.dataRoot, req.params.entityName))
    res.status(200).send(`Added all database files for entity ${req.params.entityName} to index`)
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res
      .status(500)
      .send(`Adding all database files for entity ${req.params.entityName} to index failed`)
  }
})

gitApi.post("/stage/:entityName/:instanceId", async (req, res) => {
  try {
    await req.git.add(join(req.dataRoot, req.params.entityName, `${req.params.instanceId}.json`))
    res
      .status(200)
      .send(
        `Added database file ${req.params.instanceId} for entity ${req.params.entityName} to index`,
      )
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res
      .status(500)
      .send(
        `Adding database file ${req.params.instanceId} for entity ${req.params.entityName} to index failed`,
      )
  }
})

gitApi.post("/unstage", async (req, res) => {
  try {
    await req.git.reset(["HEAD", "--", req.dataRoot])
    res.status(200).send("Removed all database files to index")
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res.status(500).send("Removing all database files to index failed")
  }
})

gitApi.post("/unstage/:entityName", async (req, res) => {
  try {
    await req.git.reset(["HEAD", "--", join(req.dataRoot, req.params.entityName)])
    res.status(200).send(`Removed all database files for entity ${req.params.entityName} to index`)
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res
      .status(500)
      .send(`Removing all database files for entity ${req.params.entityName} to index failed`)
  }
})

gitApi.post("/unstage/:entityName/:instanceId", async (req, res) => {
  try {
    await req.git.reset([
      "HEAD",
      "--",
      join(req.dataRoot, req.params.entityName, `${req.params.instanceId}.json`),
    ])
    res
      .status(200)
      .send(
        `Removed database file ${req.params.instanceId} for entity ${req.params.entityName} to index`,
      )
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res
      .status(500)
      .send(
        `Removing database file ${req.params.instanceId} for entity ${req.params.entityName} to index failed`,
      )
  }
})

gitApi.post("/commit", async (req, res) => {
  const message = req.body.message

  if (typeof message !== "string" || message.length === 0) {
    res.status(400).send("Invalid commit message")
    return
  }

  try {
    await req.git.commit(message)
    res.status(200).send("Commit successful")
  } catch (error) {
    res.status(500).send("Commit failed")
  }
})

gitApi.post("/push", async (req, res) => {
  try {
    await req.git.push()
    res.status(200).send("Push successful")
  } catch (error) {
    res.status(500).send("Push failed")
  }
})

gitApi.post("/pull", async (req, res) => {
  try {
    await req.git.pull()
    res.status(200).send("Pull successful")
  } catch (error) {
    res.status(500).send("Pull failed")
  }
})

gitApi.get("/branch", async (req, res) => {
  const branchSummary = await req.git.branchLocal()

  const body: GetAllGitBranchesResponseBody = {
    allBranches: branchSummary.all,
    currentBranch: branchSummary.current,
  }

  res.json(body)
})

gitApi.post("/branch", async (req, res) => {
  const branchName = req.body.branchName

  if (typeof branchName !== "string" || branchName.length === 0) {
    res.status(400).send("Invalid branch name")
    return
  }

  try {
    await req.git.checkoutLocalBranch(branchName)
    await reinit(req)
    res.status(200).send(`Creation of branch "${branchName}" successful`)
  } catch (error) {
    res.status(500).send(`Creation of branch "${branchName}" failed`)
  }
})

gitApi.post("/branch/:branchName", async (req, res) => {
  try {
    await req.git.checkout(req.params.branchName)
    res.status(200).send(`Switch to branch "${req.params.branchName}" successful`)
  } catch (error) {
    res.status(500).send(`Switch to branch "${req.params.branchName}" failed`)
  }
})
