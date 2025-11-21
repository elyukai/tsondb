import { useCallback, useContext, useEffect, useMemo, useState } from "preact/hooks"
import type { GitStatusResponseBody } from "../../shared/api.ts"
import {
  isSerializedEntityDecl,
  isSerializedEntityDeclWithParentReference,
} from "../../shared/schema/declarations/EntityDecl.ts"
import {
  isChangedInIndex,
  isChangedInWorkingDir,
  splitBranchName,
  type GitFileStatus,
} from "../../shared/utils/git.ts"
import type { InstanceContainerOverview } from "../../shared/utils/instances.ts"
import { deleteInstanceByEntityNameAndId } from "../api/declarations.ts"
import * as GitApi from "../api/git.ts"
import type { GitEntityOverview } from "../components/git/GitFileList.tsx"
import { EntitiesContext, type EntitySummary } from "../context/entities.ts"
import { runWithLoading } from "../signals/loading.ts"
import { logAndAlertError } from "../utils/debug.ts"
import { useSetting } from "./useSettings.ts"

const filterFilesForDisplay = (
  predicate: (fileStatus: GitFileStatus) => boolean,
  entities: EntitySummary[],
  data: GitStatusResponseBody,
): GitEntityOverview[] =>
  Object.entries(data.instances)
    .map(
      ([entityName, instances]): GitEntityOverview => [
        entityName,
        entities.find(entity => entity.declaration.name === entityName)?.declaration.namePlural ??
          entityName,
        instances
          .filter(instance => instance.gitStatus !== undefined && predicate(instance.gitStatus))
          .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true })),
      ],
    )
    .filter(([_1, _2, instances]) => instances.length > 0)
    .sort((a, b) => a[1].localeCompare(b[1]))

export type GitBranchSummary = {
  current: boolean
  name: string
  commit: string
  label: string
  linkedWorkTree: boolean
  remote?: string
}

export type GitClient = {
  isRepo: boolean
  commitsAhead: number
  commitsBehind: number
  indexFiles: GitEntityOverview[]
  workingTreeFiles: GitEntityOverview[]
  allBranches: string[]
  currentBranch: string
  branches: Record<string, GitBranchSummary>
  isDetached: boolean
  latestCommit: string
  updateLocalState: () => Promise<void>
  getGitStatusOfInstance: (entityName: string, instanceId: string) => GitFileStatus | undefined
  fetch: () => Promise<void>
  stage: (entityName: string, instance: InstanceContainerOverview) => Promise<void>
  stageAll: (entityName?: string) => Promise<void>
  unstage: (entityName: string, instance: InstanceContainerOverview) => Promise<void>
  unstageAll: (entityName?: string) => Promise<void>
  reset: (entityName: string, instance: InstanceContainerOverview) => Promise<void>
  commit: (commitMessage: string) => Promise<void>
  push: () => Promise<void>
  pull: () => Promise<void>
  createBranch: (newBranchName: string) => Promise<void>
  switchBranch: (targetBranch: string) => Promise<void>
  deleteBranch: (targetBranch: string) => Promise<void>
}

export const useGitClient = (): GitClient => {
  const [locales] = useSetting("displayedLocales")
  const { entities } = useContext(EntitiesContext)
  const [isRepo, setIsRepo] = useState(false)
  const [commitsAhead, setCommitsAhead] = useState(0)
  const [commitsBehind, setCommitsBehind] = useState(0)
  const [indexFiles, setIndexFiles] = useState<GitEntityOverview[]>([])
  const [workingTreeFiles, setWorkingTreeFiles] = useState<GitEntityOverview[]>([])
  const [allBranches, setAllBranches] = useState<string[]>([])
  const [currentBranch, setCurrentBranch] = useState("")
  const [latestCommit, setLatestCommit] = useState("")
  const [branches, setBranches] = useState<Record<string, GitBranchSummary>>({})
  const [isDetached, setIsDetached] = useState(false)

  const updateGitStatus = useCallback(async () => {
    const { isRepo } = await GitApi.isRepo(locales)
    setIsRepo(isRepo)

    if (isRepo && entities.length > 0) {
      try {
        const [statusData, branchesData] = await Promise.all([
          GitApi.getStatus(locales),
          GitApi.getBranches(locales),
        ])

        setIndexFiles(filterFilesForDisplay(isChangedInIndex, entities, statusData))
        setWorkingTreeFiles(filterFilesForDisplay(isChangedInWorkingDir, entities, statusData))
        setCommitsAhead(statusData.commitsAhead)
        setCommitsBehind(statusData.commitsBehind)
        setAllBranches(branchesData.allBranches)
        setCurrentBranch(branchesData.currentBranch)
        setBranches(
          Object.fromEntries(
            Object.entries(branchesData.branches).map(
              ([branch, branchSummary]): [string, GitBranchSummary] => {
                const { remote, name } = splitBranchName(branch)

                return [
                  branch,
                  {
                    ...branchSummary,
                    remote,
                    name,
                  },
                ]
              },
            ),
          ),
        )
        setIsDetached(branchesData.isDetached)
        setLatestCommit(statusData.latestCommit)
        console.log(statusData.latestCommit)
      } catch (error) {
        logAndAlertError(error, "Error updating git status: ")
      }
    }
  }, [entities, locales])

  useEffect(() => {
    void updateGitStatus()
  }, [updateGitStatus])

  const getGitStatusOfInstance = useCallback(
    (entityName: string, instanceId: string): GitFileStatus | undefined => {
      const entity = indexFiles.find(([name]) => name === entityName)
      const instanceInIndex = entity?.[2].find(instance => instance.id === instanceId)
      if (instanceInIndex?.gitStatus !== undefined) {
        return instanceInIndex.gitStatus
      }

      const workingTreeEntity = workingTreeFiles.find(([name]) => name === entityName)
      const instanceInWorkingTree = workingTreeEntity?.[2].find(
        instance => instance.id === instanceId,
      )
      return instanceInWorkingTree?.gitStatus
    },
    [indexFiles, workingTreeFiles],
  )

  const fetch = useCallback(async () => {
    await runWithLoading(async () => {
      try {
        await GitApi.fetch(locales)
        await updateGitStatus()
      } catch (error: unknown) {
        logAndAlertError(error, "Error fetching from remote: ")
      }
    })
  }, [locales, updateGitStatus])

  const stage = useCallback(
    async (entityName: string, instance: InstanceContainerOverview) => {
      await runWithLoading(async () => {
        try {
          await GitApi.stageFileOfEntity(locales, entityName, instance.id)
          await updateGitStatus()
        } catch (error: unknown) {
          logAndAlertError(error, "Error staging instance: ")
        }
      })
    },
    [locales, updateGitStatus],
  )

  const stageAll = useCallback(
    async (entityName?: string) => {
      await runWithLoading(async () => {
        try {
          if (entityName) {
            await GitApi.stageAllFilesOfEntity(locales, entityName)
          } else {
            await GitApi.stageAllFiles(locales)
          }
          await updateGitStatus()
        } catch (error: unknown) {
          logAndAlertError(error, "Error staging all instances: ")
        }
      })
    },
    [locales, updateGitStatus],
  )

  const unstage = useCallback(
    async (entityName: string, instance: InstanceContainerOverview) => {
      await runWithLoading(async () => {
        try {
          await GitApi.unstageFileOfEntity(locales, entityName, instance.id)
          await updateGitStatus()
        } catch (error: unknown) {
          logAndAlertError(error, "Error unstaging instance: ")
        }
      })
    },
    [locales, updateGitStatus],
  )

  const unstageAll = useCallback(
    async (entityName?: string) => {
      await runWithLoading(async () => {
        try {
          if (entityName) {
            await GitApi.unstageAllFilesOfEntity(locales, entityName)
          } else {
            await GitApi.unstageAllFiles(locales)
          }
          await updateGitStatus()
        } catch (error: unknown) {
          logAndAlertError(error, "Error unstaging all instances: ")
        }
      })
    },
    [locales, updateGitStatus],
  )

  const reset = useCallback(
    async (entityName: string, instance: InstanceContainerOverview) => {
      await runWithLoading(async () => {
        if (
          !confirm(
            `Are you sure you want to reset instance "${instance.displayName}" (${instance.id})?`,
          )
        ) {
          return
        }

        const entity = entities.find(e => e.declaration.name === entityName)?.declaration
        if (
          instance.gitStatus?.workingDir === "D" &&
          entity &&
          isSerializedEntityDecl(entity) &&
          isSerializedEntityDeclWithParentReference(entity) &&
          !confirm(
            `If you deleted the parent of "${instance.displayName}" (${instance.id}) before, make sure to restore it as well. Continue?`,
          )
        ) {
          return
        }

        try {
          if (instance.gitStatus?.workingDir === "?") {
            await deleteInstanceByEntityNameAndId(locales, entityName, instance.id)
          } else {
            await GitApi.resetFileOfEntity(locales, entityName, instance.id)
          }
          await updateGitStatus()
        } catch (error: unknown) {
          logAndAlertError(error, "Error resetting instance: ")
        }
      })
    },
    [entities, locales, updateGitStatus],
  )

  const commit = useCallback(
    async (commitMessage: string) => {
      await runWithLoading(async () => {
        if (
          commitMessage.length > 0 &&
          indexFiles.length > 0 &&
          confirm("Do you want to commit all staged files?")
        ) {
          try {
            await GitApi.commitStagedFiles(locales, commitMessage)
            await updateGitStatus()
          } catch (error) {
            logAndAlertError(error, "Error committing instances: ")
          }
        }
      })
    },
    [indexFiles.length, locales, updateGitStatus],
  )

  const push = useCallback(async () => {
    await runWithLoading(async () => {
      try {
        await GitApi.pushCommits(locales)
        alert("Pushed commits successfully")
        await updateGitStatus()
      } catch (error: unknown) {
        logAndAlertError(error, "Error pushing commits: ")
      }
    })
  }, [locales, updateGitStatus])

  const pull = useCallback(async () => {
    await runWithLoading(async () => {
      try {
        await GitApi.pullCommits(locales)
        alert("Pulled commits successfully")
        await updateGitStatus()
      } catch (error: unknown) {
        logAndAlertError(error, "Error pulling commits: ")
      }
    })
  }, [locales, updateGitStatus])

  const createBranch = useCallback(
    async (newBranchName: string) => {
      await runWithLoading(async () => {
        if (newBranchName.length === 0) {
          alert("Branch name cannot be empty")
          return
        }

        if (allBranches.includes(newBranchName)) {
          alert("Branch name already exists")
          return
        }

        try {
          await GitApi.createBranch(locales, newBranchName)
          alert(`Created branch "${newBranchName}" successfully`)
          await updateGitStatus()
        } catch (error) {
          logAndAlertError(error, "Error creating branch: ")
        }
      })
    },
    [allBranches, locales, updateGitStatus],
  )

  const switchBranch = useCallback(
    async (targetBranch: string) => {
      await runWithLoading(async () => {
        try {
          await GitApi.switchBranch(locales, targetBranch)
          await updateGitStatus()
        } catch (error: unknown) {
          logAndAlertError(error, "Error switching branch: ")
        }
      })
    },
    [locales, updateGitStatus],
  )

  const deleteBranch = useCallback(
    async (targetBranch: string) => {
      await runWithLoading(async () => {
        if (targetBranch === currentBranch) {
          alert("Cannot delete the current branch")
          return
        }

        if (!allBranches.includes(targetBranch)) {
          alert(`Branch "${targetBranch}" does not exist`)
          return
        }

        if (!confirm(`Are you sure you want to delete branch "${targetBranch}"?`)) {
          return
        }

        try {
          await GitApi.deleteBranch(locales, targetBranch)
          alert(`Deleted branch "${targetBranch}" successfully`)
          await updateGitStatus()
        } catch (error) {
          logAndAlertError(error, "Error deleting branch: ")
        }
      })
    },
    [allBranches, currentBranch, locales, updateGitStatus],
  )

  return useMemo(
    () => ({
      isRepo,
      commitsAhead,
      commitsBehind,
      indexFiles,
      workingTreeFiles,
      allBranches,
      currentBranch,
      branches,
      isDetached,
      latestCommit,
      getGitStatusOfInstance,
      updateLocalState: updateGitStatus,
      fetch,
      stage,
      stageAll,
      unstage,
      unstageAll,
      reset,
      commit,
      push,
      pull,
      createBranch,
      switchBranch,
      deleteBranch,
    }),
    [
      allBranches,
      branches,
      commit,
      commitsAhead,
      commitsBehind,
      createBranch,
      currentBranch,
      deleteBranch,
      fetch,
      getGitStatusOfInstance,
      indexFiles,
      isDetached,
      isRepo,
      latestCommit,
      pull,
      push,
      reset,
      stage,
      stageAll,
      switchBranch,
      unstage,
      unstageAll,
      updateGitStatus,
      workingTreeFiles,
    ],
  )
}
