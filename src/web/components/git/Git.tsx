import type { FunctionComponent } from "preact"
import { useContext, useState } from "preact/hooks"
import { GitContext } from "../../context/git.ts"
import { GitClientContext } from "../../context/gitClient.ts"
import { GitFileList } from "./GitFileList.tsx"

export const Git: FunctionComponent = () => {
  const [isOpen] = useContext(GitContext)
  const client = useContext(GitClientContext)
  const [commitMessage, setCommitMessage] = useState("")

  if (!client || !client.isRepo) {
    return null
  }

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

  return (
    <aside class="git">
      <h2 class="h1-faded">Version Control</h2>
      <div className={`git-overlay ${isOpen ? "git-overlay--open" : ""}`}>
        <div class="sync">
          <button onClick={() => void client.push()}>
            Push{client.commitsAhead > 0 ? ` (${client.commitsAhead.toString()})` : ""}
          </button>
          <button onClick={() => void client.pull()}>
            Pull{client.commitsBehind > 0 ? ` (${client.commitsBehind.toString()})` : ""}
          </button>
        </div>
        <div className="branch">
          <div className="select-wrapper">
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
        <div class="commit">
          <input
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
        <div className="git-section-title">
          <h3>Files to be committed</h3>
          <button onClick={() => void client.unstageAll()}>Unstage all</button>
        </div>
        <GitFileList
          filesByEntity={client.indexFiles}
          fileButtonLabel="Unstage"
          onFileButtonClick={client.unstage}
        />
        <div className="git-section-title">
          <h3>Working tree changes</h3>
          <button onClick={() => void client.stageAll()}>Stage all</button>
        </div>
        <GitFileList
          filesByEntity={client.workingTreeFiles}
          fileButtonLabel="Stage"
          onFileButtonClick={client.stage}
        />
      </div>
    </aside>
  )
}
