import Debug from "debug"
import express, { type Request } from "express"
import { join } from "node:path"
import type {
  CreateBranchRequestBody,
  CreateCommitRequestBody,
  GetAllGitBranchesResponseBody,
  GitStatusResponseBody,
  IsRepoResponseBody,
} from "../../../shared/api.ts"
import { hasFileChanges, splitBranchName } from "../../../shared/utils/git.ts"
import { getInstanceContainerOverview } from "../../../shared/utils/instances.ts"
import { attachGitStatusToInstancesByEntityName } from "../../utils/instances.ts"
import { reinit } from "../init.ts"
import { createChildInstancesForInstanceIdGetter } from "../utils/childInstances.ts"

const debug = Debug("tsondb:server:api:git")

export const gitApi = express.Router()

gitApi.use((req, res, next) => {
  debug(req.path)
  if (req.path !== "/" && req.gitRoot === undefined) {
    res.status(400).send("Git repository not found")
    return
  }

  next()
})

gitApi.get("/", (req, res) => {
  const body: IsRepoResponseBody = {
    isRepo: req.gitRoot !== undefined,
  }

  res.json(body)
})

gitApi.get("/status", async (req, res) => {
  const status = await req.git.status()

  attachGitStatusToInstancesByEntityName(
    req.instancesByEntityName,
    req.dataRoot,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    req.gitRoot!,
    status,
  )

  const getChildInstancesForInstanceId = createChildInstancesForInstanceIdGetter(req)

  const body: GitStatusResponseBody = {
    currentBranch: status.current,
    trackingBranch: status.tracking,
    commitsAhead: status.ahead,
    commitsBehind: status.behind,
    instances: Object.fromEntries(
      Object.entries(req.instancesByEntityName).map(([entityName, instances]) => [
        entityName,
        instances
          .filter(instance => hasFileChanges(instance.gitStatus))
          .map(instance =>
            getInstanceContainerOverview(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              req.entitiesByName[entityName]!,
              instance,
              req.getInstanceById,
              getChildInstancesForInstanceId,
              req.locales,
            ),
          ),
      ]),
    ),
    latestCommit: await req.git.revparse(["HEAD"]),
  }

  res.json(body)
})

gitApi.post("/fetch", async (req, res) => {
  try {
    await req.git.fetch(["--all", "-p"])
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
    await req.git.add(req.dataRoot)
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
    await req.git.add(join(req.dataRoot, req.params.entityName))
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
    await req.git.add(join(req.dataRoot, req.params.entityName, `${req.params.instanceId}.json`))
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
    await req.git.reset(["HEAD", "--", req.dataRoot])
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
    await req.git.reset(["HEAD", "--", join(req.dataRoot, req.params.entityName)])
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
    await req.git.reset([
      "HEAD",
      "--",
      join(req.dataRoot, req.params.entityName, `${req.params.instanceId}.json`),
    ])
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
    await req.git.raw(["restore", "--", req.dataRoot])
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
    await req.git.raw([
      "restore",
      "--",
      join(req.dataRoot, req.params.entityName, `${req.params.instanceId}.json`),
    ])
    await reinit(req)
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
    await req.git.commit(message)
    res.set("Content-Type", "text/plain")
    res.status(200).send("Commit successful")
  } catch (error) {
    res.set("Content-Type", "text/plain")
    res.status(500).send(error instanceof Error ? error.message : "Commit failed")
  }
})

gitApi.post("/push", async (req, res) => {
  try {
    const status = await req.git.status()
    const remotes = await req.git.getRemotes()
    await req.git.push(remotes[0]?.name, status.current ?? undefined)
    res.set("Content-Type", "text/plain")
    res.status(200).send("Push successful")
  } catch (error) {
    res.set("Content-Type", "text/plain")
    res.status(500).send(error instanceof Error ? error.message : "Push failed")
  }
})

gitApi.post("/pull", async (req, res) => {
  try {
    const status = await req.git.status()
    const remotes = await req.git.getRemotes()
    await req.git.pull(remotes[0]?.name, status.current ?? undefined)
    await reinit(req)
    res.set("Content-Type", "text/plain")
    res.status(200).send("Pull successful")
  } catch (error) {
    res.set("Content-Type", "text/plain")
    res.status(500).send(error instanceof Error ? error.message : "Pull failed")
  }
})

gitApi.get("/branch", async (req, res) => {
  const branchSummary = await req.git.branch()

  const body: GetAllGitBranchesResponseBody = {
    allBranches: branchSummary.all,
    currentBranch: branchSummary.current,
    isDetached: branchSummary.detached,
    branches: branchSummary.branches,
  }

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
    await req.git.checkoutLocalBranch(branchName)
    await reinit(req)
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
    await req.git.raw("switch", actualBranch)
    await reinit(req)

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
    const branchSummary = await req.git.branchLocal()

    if (branchSummary.current === branchName) {
      res.set("Content-Type", "text/plain")
      res.status(400).send("Cannot delete the branch currently checked out")
      return
    }

    await req.git.deleteLocalBranch(branchName, true)
    res.set("Content-Type", "text/plain")
    res.status(200).send(`Deletion of branch "${branchName}" successful`)
  } catch (error) {
    res.set("Content-Type", "text/plain")
    res
      .status(500)
      .send(error instanceof Error ? error.message : `Deletion of branch "${branchName}" failed`)
  }
})
