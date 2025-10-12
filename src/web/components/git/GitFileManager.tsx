import type { FunctionComponent } from "preact"
import { useCallback, useState } from "preact/hooks"
import type { InstanceContainerOverview } from "../../../shared/utils/instances.ts"
import type { GitClient } from "../../hooks/useGitClient.ts"
import { GitFileList } from "./GitFileList.tsx"

type Props = {
  client: GitClient
  manageBranches?: () => void
}

export const GitFileManager: FunctionComponent<Props> = ({ client, manageBranches }) => {
  const [commitMessage, setCommitMessage] = useState("")

  const commit = () => {
    void client.commit(commitMessage)
  }

  const onCreateBranch = () => {
    const newBranchName = prompt("Enter new branch name:")

    if (newBranchName !== null) {
      void client.createBranch(newBranchName)
    }
  }

  const onSwitchBranch = (event: preact.TargetedEvent<HTMLSelectElement>) => {
    void client.switchBranch(event.currentTarget.value)
  }

  const onFileButtonClick = useCallback(
    async (
      entityName: string,
      instance: InstanceContainerOverview,
      action: "stage" | "unstage" | "reset",
    ): Promise<void> => {
      switch (action) {
        case "stage":
          return client.stage(entityName, instance)
        case "unstage":
          return client.unstage(entityName, instance)
        case "reset":
          return client.reset(entityName, instance)
      }
    },
    [client],
  )

  return (
    <div class="git-files">
      <div class="form-row form-row--sides">
        <div class="form-row__group">
          <button onClick={() => void client.push()}>
            Push{client.commitsAhead > 0 ? ` (${client.commitsAhead.toString()})` : ""}
          </button>
          <button onClick={() => void client.pull()}>
            Pull{client.commitsBehind > 0 ? ` (${client.commitsBehind.toString()})` : ""}
          </button>
        </div>
        {manageBranches ? <button onClick={manageBranches}>Manage Branches</button> : null}
      </div>
      <div class="form-row">
        <div class="select-wrapper form-row__fill">
          <select value={client.currentBranch} onInput={onSwitchBranch}>
            {client.allBranches.map(branch => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>
        <button onClick={onCreateBranch}>New branch</button>
      </div>
      <div class="form-row">
        <input
          class="form-row__fill"
          type="text"
          value={commitMessage}
          onInput={event => {
            setCommitMessage(event.currentTarget.value)
          }}
          placeholder="added X to instance Y, …"
        />
        <button
          onClick={commit}
          disabled={commitMessage.length === 0 || client.indexFiles.length === 0}
        >
          Commit
        </button>
      </div>
      <div class="git-section-title">
        <h3>Files to be committed</h3>
        <button onClick={() => void client.unstageAll()}>Unstage all</button>
      </div>
      <GitFileList
        filesByEntity={client.indexFiles}
        fileButtons={[{ label: "Unstage", action: "unstage" }]}
        onFileButtonClick={onFileButtonClick}
      />
      <div class="git-section-title">
        <h3>Working tree changes</h3>
        <button onClick={() => void client.stageAll()}>Stage all</button>
      </div>
      <GitFileList
        filesByEntity={client.workingTreeFiles}
        fileButtons={[
          { label: "Stage", action: "stage" },
          { label: "Reset", action: "reset" },
        ]}
        onFileButtonClick={onFileButtonClick}
      />
    </div>
  )
}
