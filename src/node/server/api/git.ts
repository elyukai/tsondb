import Debug from "debug"
import express, { type Request } from "express"
import type {
  CreateBranchRequestBody,
  CreateCommitRequestBody,
  GetAllGitBranchesResponseBody,
  GitStatusResponseBody,
  IsRepoResponseBody,
} from "../../../shared/api.ts"
import { splitBranchName } from "../../../shared/utils/git.ts"
import { sendErrorResponse } from "../../utils/error.ts"

const debug = Debug("tsondb:server:api:git")

export const gitApi = express.Router()

gitApi.use((req, res, next) => {
  debug(req.path)
  if (req.path !== "/" && !req.db.isGitRepo()) {
    res.status(400).send("Git repository not found")
    return
  }

  next()
})

gitApi.get("/", (req, res) => {
  const body: IsRepoResponseBody = {
    isRepo: req.db.isGitRepo(),
  }

  res.json(body)
})

gitApi.get("/status", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    const body: GitStatusResponseBody = await req.db.git!.status()
    res.json(body)
  } catch (err) {
    sendErrorResponse(res, err)
  }
})

gitApi.post("/fetch", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.fetch({ all: true, prune: true })
    res.set("Content-Type", "text/plain")
    res.status(200).send("Fetched all remotes")
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res.set("Content-Type", "text/plain")
    res.status(500).send(error instanceof Error ? error.message : "Fetching all remotes failed")
  }
})

gitApi.post("/stage", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.stage()
    res.set("Content-Type", "text/plain")
    res.status(200).send("Added all database files to index")
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(error instanceof Error ? error.message : "Adding all database files to index failed")
  }
})

gitApi.post("/stage/:entityName", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.stage(req.params.entityName)
    res.set("Content-Type", "text/plain")
    res.status(200).send(`Added all database files for entity ${req.params.entityName} to index`)
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(
        error instanceof Error
          ? error.message
          : `Adding all database files for entity ${req.params.entityName} to index failed`,
      )
  }
})

gitApi.post("/stage/:entityName/:instanceId", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.stage(req.params.entityName, req.params.instanceId)
    res.set("Content-Type", "text/plain")
    res
      .status(200)
      .send(
        `Added database file ${req.params.instanceId} for entity ${req.params.entityName} to index`,
      )
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(
        error instanceof Error
          ? error.message
          : `Adding database file ${req.params.instanceId} for entity ${req.params.entityName} to index failed`,
      )
  }
})

gitApi.post("/unstage", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.unstage()
    res.set("Content-Type", "text/plain")
    res.status(200).send("Removed all database files to index")
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(error instanceof Error ? error.message : "Removing all database files to index failed")
  }
})

gitApi.post("/unstage/:entityName", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.unstage(req.params.entityName)
    res.set("Content-Type", "text/plain")
    res.status(200).send(`Removed all database files for entity ${req.params.entityName} to index`)
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(
        error instanceof Error
          ? error.message
          : `Removing all database files for entity ${req.params.entityName} to index failed`,
      )
  }
})

gitApi.post("/unstage/:entityName/:instanceId", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.unstage(req.params.entityName, req.params.instanceId)
    res.set("Content-Type", "text/plain")
    res
      .status(200)
      .send(
        `Removed database file ${req.params.instanceId} for entity ${req.params.entityName} to index`,
      )
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(
        error instanceof Error
          ? error.message
          : `Removing database file ${req.params.instanceId} for entity ${req.params.entityName} to index failed`,
      )
  }
})

gitApi.post("/reset", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.restore()
    res.set("Content-Type", "text/plain")
    res.status(200).send("Removed all database files to index")
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(error instanceof Error ? error.message : "Removing all database files to index failed")
  }
})

gitApi.post("/reset/:entityName/:instanceId", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.restore(req.params.entityName, req.params.instanceId)
    res.set("Content-Type", "text/plain")
    res
      .status(200)
      .send(
        `Removed database file ${req.params.instanceId} for entity ${req.params.entityName} to index`,
      )
  } catch (error) {
    debug(`${req.path}: ${(error as Error).message}`)
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(
        error instanceof Error
          ? error.message
          : `Removing database file ${req.params.instanceId} for entity ${req.params.entityName} to index failed`,
      )
  }
})

type CreateCommitRequest = Request<unknown, unknown, CreateCommitRequestBody>

gitApi.post("/commit", async (req: CreateCommitRequest, res) => {
  const message = req.body.message

  if (typeof message !== "string" || message.length === 0) {
    res.set("Content-Type", "text/plain")
    res.status(400).send("Invalid commit message")
    return
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.commit(message)
    res.set("Content-Type", "text/plain")
    res.status(200).send("Commit successful")
  } catch (error) {
    res.set("Content-Type", "text/plain")
    res.status(500).send(error instanceof Error ? error.message : "Commit failed")
  }
})

gitApi.post("/push", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.push()
    res.set("Content-Type", "text/plain")
    res.status(200).send("Push successful")
  } catch (error) {
    res.set("Content-Type", "text/plain")
    res.status(500).send(error instanceof Error ? error.message : "Push failed")
  }
})

gitApi.post("/pull", async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.pull()
    res.set("Content-Type", "text/plain")
    res.status(200).send("Pull successful")
  } catch (error) {
    res.set("Content-Type", "text/plain")
    res.status(500).send(error instanceof Error ? error.message : "Pull failed")
  }
})

gitApi.get("/branch", async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
  const body: GetAllGitBranchesResponseBody = await req.db.git!.branch()
  res.json(body)
})

type CreateBranchRequest = Request<unknown, unknown, CreateBranchRequestBody>

gitApi.post("/branch", async (req: CreateBranchRequest, res) => {
  const branchName = req.body.branchName

  if (typeof branchName !== "string" || branchName.length === 0) {
    res.set("Content-Type", "text/plain")
    res.status(400).send("Invalid branch name")
    return
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.createBranch(branchName)
    res.set("Content-Type", "text/plain")
    res.status(200).send(`Creation of branch "${branchName}" successful`)
  } catch (error) {
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(error instanceof Error ? error.message : `Creation of branch "${branchName}" failed`)
  }
})

gitApi.post("/branch/:branchName", async (req, res) => {
  const branchName = decodeURIComponent(req.params.branchName)

  try {
    const { remote, name: actualBranch } = splitBranchName(branchName)
    if (remote) {
      debug(`Switch to remote branch "${remote}/${actualBranch}"`)
    } else {
      debug(`Switch to local branch "${actualBranch}"`)
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.switchBranch(actualBranch)

    res.set("Content-Type", "text/plain")
    res.status(200).send(`Switch to branch "${branchName}" successful`)
  } catch (error) {
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(error instanceof Error ? error.message : `Switch to branch "${branchName}" failed`)
  }
})

gitApi.delete("/branch/:branchName", async (req, res) => {
  const branchName = decodeURIComponent(req.params.branchName)

  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by middleware
    await req.db.git!.deleteBranch(branchName, { force: true })
    res.set("Content-Type", "text/plain")
    res.status(200).send(`Deletion of branch "${branchName}" successful`)
  } catch (error) {
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(error instanceof Error ? error.message : `Deletion of branch "${branchName}" failed`)
  }
})
