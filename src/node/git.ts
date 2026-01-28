import Debug from "debug"
import { join } from "path"
import type { SimpleGit } from "simple-git"
import type { InstanceContainerOverview } from "../shared/utils/instances.ts"
import type { DefaultTSONDBTypes, EntityName, TSONDB } from "./index.ts"
import type { DatabaseInMemory } from "./utils/databaseInMemory.ts"
import { getAllInstanceOverviewsByEntityName } from "./utils/displayName.ts"
import { HTTPError } from "./utils/error.js"
import { getFileNameForId } from "./utils/files.js"
import { attachGitStatusToDatabaseInMemory } from "./utils/git.ts"

const debug = Debug("tsondb:git")

export class Git<T extends DefaultTSONDBTypes = DefaultTSONDBTypes> {
  #db: TSONDB<T>
  #git: SimpleGit
  #gitRoot: string
  #dataRoot: string
  #getData: () => DatabaseInMemory<T["entityMap"]>
  #setData: (data: DatabaseInMemory<T["entityMap"]>) => void

  constructor(
    db: TSONDB<T>,
    git: SimpleGit,
    gitRoot: string,
    dataRoot: string,
    getData: () => DatabaseInMemory<T["entityMap"]>,
    setData: (data: DatabaseInMemory<T["entityMap"]>) => void,
  ) {
    this.#db = db
    this.#git = git
    this.#gitRoot = gitRoot
    this.#dataRoot = dataRoot
    this.#getData = getData
    this.#setData = setData
  }

  /**
   * Runs a `git status` operation and updates the in-memory database with the latest statuses.
   *
   * @throws {HTTPError} when no git repository is found
   */
  async status(): Promise<{
    currentBranch: string | null
    trackingBranch: string | null
    commitsAhead: number
    commitsBehind: number
    latestCommit: string
    instances: Record<string, InstanceContainerOverview[]>
  }> {
    debug("status")
    const status = await this.#git.status()

    const data = attachGitStatusToDatabaseInMemory(
      this.#getData(),
      this.#dataRoot,
      this.#gitRoot,
      status,
    )
    this.#setData(data)

    return {
      currentBranch: status.current,
      trackingBranch: status.tracking,
      commitsAhead: status.ahead,
      commitsBehind: status.behind,
      instances: getAllInstanceOverviewsByEntityName(
        this.#db.getInstanceContainerOfEntityById.bind(this.#db),
        this.#db.getAllChildInstanceContainersForParent.bind(this.#db),
        this.#db.schema.getEntity.bind(this.#db.schema),
        data,
        this.#db.locales,
      ),
      latestCommit: await this.#git.revparse(["HEAD"]),
    }
  }

  /**
   * Fetches updates from remote git repositories.
   *
   * @throws {HTTPError} when no git repository is found
   */
  async fetch(options: Partial<{ all: boolean; prune: boolean }>): Promise<void> {
    debug("fetch")
    const args: Partial<Record<keyof typeof options, string>> = {
      all: options.all ? "--all" : undefined,
      prune: options.prune ? "-p" : undefined,
    }

    await this.#git.fetch(Object.values(args))
  }

  /**
   * Adds files to the git staging area.
   *
   * - If the function is called without parameters, all changes to all instances are added.
   * - If the function is called with only the `entity` parameter, all changes to instances of that entity are added.
   * - If both `entity` and `id` parameters are provided, only the changes to that specific instance are added.
   *
   * @throws {HTTPError} when no git repository is found
   */
  async stage(entity?: EntityName<T>, id?: string): Promise<void> {
    if (entity) {
      if (id) {
        debug("add instance %s of entity %s", id, entity)
        await this.#git.add(join(this.#dataRoot, entity, getFileNameForId(id)))
      } else {
        debug("add all instances of entity %s", entity)
        await this.#git.add(join(this.#dataRoot, entity))
      }
    } else {
      debug("add all instances")
      await this.#git.add(this.#dataRoot)
    }
  }

  /**
   * Removes files from the git staging area.
   *
   * - If the function is called without parameters, all changes to all instances are removed.
   * - If the function is called with only the `entity` parameter, all changes to instances of that entity are removed.
   * - If both `entity` and `id` parameters are provided, only the changes to that specific instance are removed.
   *
   * @throws {HTTPError} when no git repository is found
   */
  async unstage(entity?: EntityName<T>, id?: string): Promise<void> {
    if (entity) {
      if (id) {
        debug("reset HEAD instance %s of entity %s", id, entity)
        await this.#git.reset(["HEAD", "--", join(this.#dataRoot, entity, getFileNameForId(id))])
      } else {
        debug("reset HEAD all instances of entity %s", entity)
        await this.#git.reset(["HEAD", "--", join(this.#dataRoot, entity)])
      }
    } else {
      debug("reset HEAD all instances")
      await this.#git.reset(["HEAD", "--", this.#dataRoot])
    }
  }

  /**
   * Restores files in the git repository to their last committed state.
   *
   * - If the function is called without parameters, all changes to all instances are restored.
   * - If the function is called with only the `entity` parameter, all changes to instances of that entity are restored.
   * - If both `entity` and `id` parameters are provided, only the changes to that specific instance are restored.
   *
   * @throws {HTTPError} when no git repository is found
   */
  async restore(entity?: EntityName<T>, id?: string): Promise<void> {
    if (entity) {
      if (id) {
        debug("restore instance %s of entity %s", id, entity)
        await this.#git.raw(["restore", "--", join(this.#dataRoot, entity, getFileNameForId(id))])
      } else {
        debug("restore all instances of entity %s", entity)
        await this.#git.raw(["restore", "--", join(this.#dataRoot, entity)])
      }
    } else {
      debug("restore all instances")
      await this.#git.raw(["restore", "--", this.#dataRoot])
    }
    await this.#db.sync()
  }

  /**
   * Commits staged changes to the git repository with the provided commit message.
   *
   * @throws {HTTPError} when no git repository is found
   * @throws {HTTPError} when the commit message is empty
   */
  async commit(message: string): Promise<void> {
    debug("commit")

    if (message.trim().length === 0) {
      throw new HTTPError(400, "Commit message cannot be empty.")
    }

    await this.#git.commit(message)
  }

  /**
   * Pushes committed changes to the remote git repository.
   *
   * @throws {HTTPError} when no git repository is found
   */
  async push(): Promise<void> {
    debug("push")
    const status = await this.#git.status()
    const remotes = await this.#git.getRemotes()
    await this.#git.push(remotes[0]?.name, status.current ?? undefined)
  }

  /**
   * Pulls changes from the remote git repository.
   *
   * @throws {HTTPError} when no git repository is found
   */
  async pull(): Promise<void> {
    debug("pull")
    const status = await this.#git.status()
    const remotes = await this.#git.getRemotes()
    await this.#git.pull(remotes[0]?.name, status.current ?? undefined)
    await this.#db.sync()
  }

  /**
   * Retrieves information about the branches in the git repository.
   */
  async branch(): Promise<{
    isDetached: boolean
    currentBranch: string
    allBranches: string[]
    branches: {
      [key: string]: {
        current: boolean
        name: string
        commit: string
        label: string
        linkedWorkTree: boolean
      }
    }
  }> {
    debug("branch")
    const branchSummary = await this.#git.branch()
    return {
      allBranches: branchSummary.all,
      currentBranch: branchSummary.current,
      isDetached: branchSummary.detached,
      branches: branchSummary.branches,
    }
  }

  /**
   * Creates a new branch in the git repository and checks it out.
   *
   * @param branchName The name of the branch to create.
   * @throws {HTTPError} when no git repository is found
   */
  async createBranch(branchName: string): Promise<void> {
    debug("create branch %s", branchName)
    await this.#git.checkoutLocalBranch(branchName)
  }

  /**
   * Switches to an existing branch in the git repository.
   *
   * @param branchName The name of the branch to switch to.
   * @throws {HTTPError} when no git repository is found
   */
  async switchBranch(branchName: string): Promise<void> {
    debug("switch branch %s", branchName)
    await this.#git.raw("switch", branchName)
    await this.#db.sync()
  }

  /**
   * Deletes a branch in the git repository.
   *
   * @param branchName The name of the branch to delete.
   * @param options Options for deleting the branch.
   * @throws {HTTPError} when no git repository is found
   * @throws {HTTPError} when trying to delete the currently checked out branch
   */
  async deleteBranch(branchName: string, options: { force?: boolean }): Promise<void> {
    debug("delete branch %s", branchName)
    const branchSummary = await this.#git.branchLocal()
    if (branchSummary.current === branchName) {
      throw new HTTPError(400, "Cannot delete the branch currently checked out.")
    }
    await this.#git.deleteLocalBranch(branchName, options.force ?? false)
  }

  /**
   * Run a custom git operation.
   *
   * @param commands The git commands to run as an array of strings.
   * @param commandMayChangeDataOnDisk Whether the command may change data on disk and thus requires a sync afterwards.
   * @returns The raw output of the git command.
   * @throws {HTTPError} when no git repository is found
   */
  async raw(commands: string[], commandMayChangeDataOnDisk: boolean): Promise<string> {
    debug("raw %O", commands)
    const result = await this.#git.raw(...commands)
    if (commandMayChangeDataOnDisk) {
      await this.#db.sync()
    }
    return result
  }
}
