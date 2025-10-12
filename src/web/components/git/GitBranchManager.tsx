import type { FunctionComponent } from "preact"
import type { GitClient } from "../../hooks/useGitClient.ts"

type Props = {
  client: GitClient
}

export const GitBranchManager: FunctionComponent<Props> = ({ client }) => {
  return (
    <div class="git-branches">
      <ul class="branches">
        {client.allBranches.map(branch => {
          const branchInfo = client.branches[branch]
          return (
            <li
              key={branch}
              class={[
                "form-row form-row--compact form-row--separated",
                branch === client.currentBranch ? "current" : undefined,
                branchInfo?.remote ? "remote" : undefined,
              ]
                .filter(className => className !== undefined)
                .join(" ")}
            >
              <span class="branch__full-name form-row__fill form-row__text" title={branch}>
                {branchInfo?.remote ? (
                  <span class="branch__origin">{branchInfo.remote}/</span>
                ) : null}
                <span class="branch__name">{branchInfo?.name ?? branch}</span>
              </span>
              <div className="form-row__group">
                {branch === client.currentBranch ? (
                  <span class="branch__current-indicator form-row__text"> (Current)</span>
                ) : null}
                <button
                  onClick={() => {
                    void client.switchBranch(branch)
                  }}
                  disabled={branch === client.currentBranch}
                >
                  Switch
                </button>
                <button
                  class="destructive"
                  onClick={() => {
                    void client.deleteBranch(branch)
                  }}
                  disabled={branch === client.currentBranch || branch.startsWith("remotes/")}
                >
                  Delete
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
