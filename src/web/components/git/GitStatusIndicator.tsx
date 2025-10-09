import type { FunctionComponent } from "preact"
import {
  getGitStatusForDisplay,
  getLabelForGitStatus,
  type GitFileStatus,
} from "../../../shared/utils/git.ts"

type Props = {
  status: GitFileStatus | undefined
}

export const GitStatusIndicator: FunctionComponent<Props> = ({ status }) => {
  const gitStatusForDisplay = getGitStatusForDisplay(status)
  return (
    <span
      class={`git-status git-status--${gitStatusForDisplay ?? ""}`}
      title={getLabelForGitStatus(gitStatusForDisplay)}
    >
      {gitStatusForDisplay}
    </span>
  )
}
