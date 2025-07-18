import type { FunctionComponent } from "preact"
import type { TargetedEvent } from "preact/compat"
import { useEffect, useState } from "preact/hooks"
import type { SerializedEntityDecl } from "../../node/schema/declarations/EntityDecl.ts"
import type { GitStatusResponseBody } from "../../shared/api.ts"
import type { GitFileStatus } from "../../shared/utils/git.ts"
import {
  getGitStatusForDisplay,
  getLabelForGitStatus,
  isChangedInIndex,
  isChangedInWorkingDir,
} from "../../shared/utils/git.ts"
import type { InstanceContainerOverview } from "../../shared/utils/instances.ts"
import {
  commitStagedFiles,
  createBranch,
  getAllEntities,
  getBranches,
  getGitStatus,
  pullCommits,
  pushCommits,
  stageAllFiles,
  stageFileOfEntity,
  switchBranch,
  unstageAllFiles,
  unstageFileOfEntity,
} from "../api.ts"

type Overview = [
  entityName: string,
  entityNamePlural: string,
  instances: InstanceContainerOverview[],
]

const filterFilesForDisplay = (
  predicate: (fileStatus: GitFileStatus) => boolean,
  entities: SerializedEntityDecl[],
  data: GitStatusResponseBody,
): Overview[] =>
  Object.entries(data.instances)
    .map(
      ([entityName, instances]): Overview => [
        entityName,
        entities.find(entity => entity.name === entityName)?.namePlural ?? entityName,
        instances
          .filter(instance => instance.gitStatus !== undefined && predicate(instance.gitStatus))
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      ],
    )
    .filter(([_1, _2, instances]) => instances.length > 0)
    .sort((a, b) => a[1].localeCompare(b[1]))

const GitFileList: FunctionComponent<{
  filesByEntity: Overview[]
  onFile: (entityName: string, instance: InstanceContainerOverview) => void
  isIndex?: boolean
}> = ({ filesByEntity, onFile, isIndex = false }) =>
  filesByEntity.length === 0 ? (
    <p class="no-changes">No changes</p>
  ) : (
    <ul class="git-entity-list">
      {filesByEntity.map(([entityName, entityNamePlural, instances]) => (
        <li key={entityName} class="git-entity-list-item">
          <span class="title">{entityNamePlural}</span>
          <ul class="git-instance-list">
            {instances.map(instance => {
              const gitStatusForDisplay = getGitStatusForDisplay(instance.gitStatus)
              return (
                <li key={instance.fileName} class="git-instance-list-item">
                  <span class="title">{instance.displayName}</span>
                  <span
                    class={`git-status git-status--${gitStatusForDisplay ?? ""}`}
                    title={getLabelForGitStatus(gitStatusForDisplay)}
                  >
                    {gitStatusForDisplay}
                  </span>
                  <button
                    onClick={() => {
                      onFile(entityName, instance)
                    }}
                  >
                    {isIndex ? "Unstage" : "Stage"}
                  </button>
                </li>
              )
            })}
          </ul>
        </li>
      ))}
    </ul>
  )

export const Git: FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [commitsAhead, setCommitsAhead] = useState(0)
  const [commitsBehind, setCommitsBehind] = useState(0)
  const [commitMessage, setCommitMessage] = useState("")
  const [indexFiles, setIndexFiles] = useState<Overview[]>([])
  const [workingTreeFiles, setWorkingTreeFiles] = useState<Overview[]>([])
  const [entities, setEntities] = useState<SerializedEntityDecl[]>([])
  const [allBranches, setAllBranches] = useState<string[]>([])
  const [currentBranch, setCurrentBranch] = useState("")

  const updateGitStatus = (localEntities: SerializedEntityDecl[]) =>
    Promise.all([getGitStatus(), getBranches()]).then(([statusData, branchesData]) => {
      setIndexFiles(filterFilesForDisplay(isChangedInIndex, localEntities, statusData))
      setWorkingTreeFiles(filterFilesForDisplay(isChangedInWorkingDir, localEntities, statusData))
      setCommitsAhead(statusData.commitsAhead)
      setCommitsBehind(statusData.commitsBehind)
      setAllBranches(branchesData.allBranches)
      setCurrentBranch(branchesData.currentBranch)
    })

  useEffect(() => {
    getAllEntities()
      .then(async data => {
        const entitiesFromServer = data.declarations.map(decl => decl.declaration)
        setEntities(entitiesFromServer)
        return updateGitStatus(entitiesFromServer)
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error("Error fetching entities:", error.toString())
        }
      })
  }, [])

  const stage = (entityName: string, instance: InstanceContainerOverview) => {
    stageFileOfEntity(entityName, instance.id)
      .then(() => updateGitStatus(entities))
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error("Error staging instance:", error.toString())
        }
      })
  }

  const stageAll = () => {
    stageAllFiles()
      .then(() => updateGitStatus(entities))
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error("Error staging all instances:", error.toString())
        }
      })
  }

  const unstage = (entityName: string, instance: InstanceContainerOverview) => {
    unstageFileOfEntity(entityName, instance.id)
      .then(() => updateGitStatus(entities))
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error("Error unstaging instance:", error.toString())
        }
      })
  }

  const unstageAll = () => {
    unstageAllFiles()
      .then(() => updateGitStatus(entities))
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error("Error unstaging all instances:", error.toString())
        }
      })
  }

  const commit = () => {
    if (
      commitMessage.length > 0 &&
      indexFiles.length > 0 &&
      confirm("Do you want to commit all staged files?")
    ) {
      commitStagedFiles(commitMessage)
        .then(() => {
          setCommitMessage("")
          return updateGitStatus(entities)
        })
        .catch((error: unknown) => {
          if (error instanceof Error) {
            console.error("Error committing instances:", error.toString())
          }
        })
    }
  }

  const push = () => {
    pushCommits()
      .then(() => {
        alert("Pushed commits successfully")
        return updateGitStatus(entities)
      })
      .catch((error: unknown) => {
        console.error("Error pushing commits:", error)
      })
  }

  const pull = () => {
    pullCommits()
      .then(() => {
        alert("Pulled commits successfully")
        return updateGitStatus(entities)
      })
      .catch((error: unknown) => {
        console.error("Error pulling commits:", error)
      })
  }

  const onCreateBranch = () => {
    const newBranchName = prompt("Enter new branch name:")

    if (!newBranchName) {
      alert("Branch name cannot be empty")
      return
    }

    if (allBranches.includes(newBranchName)) {
      alert("Branch name already exists")
      return
    }

    createBranch(newBranchName)
      .then(() => {
        return updateGitStatus(entities)
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          alert("Error switching branch:" + error.toString())
        }
      })
  }

  const onSwitchBranch = (event: TargetedEvent<HTMLSelectElement>) => {
    switchBranch(event.currentTarget.value)
      .then(() => {
        return updateGitStatus(entities)
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          alert("Error switching branch: " + error.toString())
        }
      })
  }

  return (
    <aside class="git">
      <h2 class="h1-faded">Version Control</h2>
      <button
        onClick={() => {
          setIsOpen(b => !b)
        }}
      >
        File changes
      </button>
      <div className={`git-overlay ${isOpen ? "git-overlay--open" : ""}`}>
        <div class="sync">
          <button onClick={push}>
            Push{commitsAhead > 0 ? ` (${commitsAhead.toString()})` : ""}
          </button>
          <button onClick={pull}>
            Pull{commitsBehind > 0 ? ` (${commitsBehind.toString()})` : ""}
          </button>
        </div>
        <div className="branch">
          <div className="select-wrapper">
            <select value={currentBranch} onInput={onSwitchBranch}>
              {allBranches.map(branch => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
          <button onClick={onCreateBranch}>New branch</button>
        </div>
        <div class="commit">
          <input
            type="text"
            value={commitMessage}
            onInput={event => {
              setCommitMessage(event.currentTarget.value)
            }}
            placeholder="added X to instance Y, …"
          />
          <button onClick={commit} disabled={commitMessage.length === 0 || indexFiles.length === 0}>
            Commit
          </button>
        </div>
        <div className="git-section-title">
          <h3>Files to be committed</h3>
          <button onClick={unstageAll}>Unstage all</button>
        </div>
        <GitFileList filesByEntity={indexFiles} isIndex onFile={unstage} />
        <div className="git-section-title">
          <h3>Working tree changes</h3>
          <button onClick={stageAll}>Stage all</button>
        </div>
        <GitFileList filesByEntity={workingTreeFiles} onFile={stage} />
      </div>
    </aside>
  )
}
