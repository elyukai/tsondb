import { useCallback, useContext, useEffect, useMemo, useState } from "preact/hooks"
import type { GitStatusResponseBody } from "../../shared/api.ts"
import {
  isChangedInIndex,
  isChangedInWorkingDir,
  type GitFileStatus,
} from "../../shared/utils/git.ts"
import type { InstanceContainerOverview } from "../../shared/utils/instances.ts"
import * as GitApi from "../api/git.ts"
import type { GitEntityOverview } from "../components/git/GitFileList.tsx"
import { EntitiesContext, type EntitySummary } from "../context/entities.ts"
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

export type GitClient = {
  isRepo: boolean
  commitsAhead: number
  commitsBehind: number
  indexFiles: GitEntityOverview[]
  workingTreeFiles: GitEntityOverview[]
  allBranches: string[]
  currentBranch: string
  update: () => Promise<void>
  stage: (entityName: string, instance: InstanceContainerOverview) => Promise<void>
  stageAll: () => Promise<void>
  unstage: (entityName: string, instance: InstanceContainerOverview) => Promise<void>
  unstageAll: () => Promise<void>
  commit: (commitMessage: string) => Promise<void>
  push: () => Promise<void>
  pull: () => Promise<void>
  createBranch: (newBranchName: string) => Promise<void>
  switchBranch: (targetBranch: string) => Promise<void>
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

  const updateGitStatus = useCallback(async () => {
    const { isRepo } = await GitApi.isRepo(locales)
    setIsRepo(isRepo)

    if (isRepo && entities.length > 0) {
      try {
        await Promise.all([GitApi.getStatus(locales), GitApi.getBranches(locales)]).then(
          ([statusData, branchesData]) => {
            setIndexFiles(filterFilesForDisplay(isChangedInIndex, entities, statusData))
            setWorkingTreeFiles(filterFilesForDisplay(isChangedInWorkingDir, entities, statusData))
            setCommitsAhead(statusData.commitsAhead)
            setCommitsBehind(statusData.commitsBehind)
            setAllBranches(branchesData.allBranches)
            setCurrentBranch(branchesData.currentBranch)
          },
        )
      } catch (error) {
        console.error("Error updating git status:", error)
      }
    }
  }, [entities, locales])

  useEffect(() => {
    void updateGitStatus()
  }, [updateGitStatus])

  const stage = useCallback(
    (entityName: string, instance: InstanceContainerOverview) =>
      GitApi.stageFileOfEntity(locales, entityName, instance.id)
        .then(() => updateGitStatus())
        .catch((error: unknown) => {
          if (error instanceof Error) {
            console.error("Error staging instance:", error.toString())
          }
        }),
    [locales, updateGitStatus],
  )

  const stageAll = useCallback(
    () =>
      GitApi.stageAllFiles(locales)
        .then(() => updateGitStatus())
        .catch((error: unknown) => {
          if (error instanceof Error) {
            console.error("Error staging all instances:", error.toString())
          }
        }),
    [locales, updateGitStatus],
  )

  const unstage = useCallback(
    (entityName: string, instance: InstanceContainerOverview) =>
      GitApi.unstageFileOfEntity(locales, entityName, instance.id)
        .then(() => updateGitStatus())
        .catch((error: unknown) => {
          if (error instanceof Error) {
            console.error("Error unstaging instance:", error.toString())
          }
        }),
    [locales, updateGitStatus],
  )

  const unstageAll = useCallback(
    () =>
      GitApi.unstageAllFiles(locales)
        .then(() => updateGitStatus())
        .catch((error: unknown) => {
          if (error instanceof Error) {
            console.error("Error unstaging all instances:", error.toString())
          }
        }),
    [locales, updateGitStatus],
  )

  const commit = useCallback(
    (commitMessage: string) => {
      if (
        commitMessage.length > 0 &&
        indexFiles.length > 0 &&
        confirm("Do you want to commit all staged files?")
      ) {
        return GitApi.commitStagedFiles(locales, commitMessage)
          .then(updateGitStatus)
          .catch((error: unknown) => {
            if (error instanceof Error) {
              console.error("Error committing instances:", error.toString())
            }
          })
      }

      return Promise.resolve()
    },
    [indexFiles.length, locales, updateGitStatus],
  )

  const push = useCallback(
    () =>
      GitApi.pushCommits(locales)
        .then(() => {
          alert("Pushed commits successfully")
          return updateGitStatus()
        })
        .catch((error: unknown) => {
          console.error("Error pushing commits:", error)
        }),
    [locales, updateGitStatus],
  )

  const pull = useCallback(
    () =>
      GitApi.pullCommits(locales)
        .then(() => {
          alert("Pulled commits successfully")
          return updateGitStatus()
        })
        .catch((error: unknown) => {
          console.error("Error pulling commits:", error)
        }),
    [locales, updateGitStatus],
  )

  const createBranch = useCallback(
    async (newBranchName: string) => {
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
        if (error instanceof Error) {
          alert("Error creating branch:" + error.toString())
        }
      }
    },
    [allBranches, locales, updateGitStatus],
  )

  const switchBranch = useCallback(
    (targetBranch: string) =>
      GitApi.switchBranch(locales, targetBranch)
        .then(updateGitStatus)
        .catch((error: unknown) => {
          if (error instanceof Error) {
            alert("Error switching branch: " + error.toString())
          }
        }),
    [locales, updateGitStatus],
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
      update: updateGitStatus,
      stage,
      stageAll,
      unstage,
      unstageAll,
      commit,
      push,
      pull,
      createBranch,
      switchBranch,
    }),
    [
      allBranches,
      commit,
      commitsAhead,
      commitsBehind,
      createBranch,
      currentBranch,
      indexFiles,
      isRepo,
      pull,
      push,
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
