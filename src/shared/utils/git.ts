export type GitFileStatus = {
  index: GitFileStatusCode
  workingDir: GitFileStatusCode
}

export const isChangedInIndex = (fileStatus: GitFileStatus): boolean => {
  const { index } = fileStatus
  switch (index) {
    case "M":
    case "T":
    case "A":
    case "D":
    case "R":
    case "C":
    case "U":
      return true
    case " ":
    case "m":
    case "?":
    case "!":
      return false
  }
}

export const isChangedInWorkingDir = (fileStatus: GitFileStatus): boolean => {
  const { workingDir } = fileStatus
  switch (workingDir) {
    case "M":
    case "T":
    case "A":
    case "D":
    case "R":
    case "C":
    case "U":
    case "?":
      return true
    case " ":
    case "m":
    case "!":
      return false
  }
}

export type GitFileStatusCode = " " | "M" | "T" | "A" | "D" | "R" | "C" | "U" | "m" | "?" | "!"

const unchangedStatusCodes = new Set([" ", "!", "C", "T", "m", "U"])

export const isUnchangedStatus = (code: GitFileStatusCode): boolean =>
  unchangedStatusCodes.has(code)

export type GitFileStatusForDisplay = "U" | "M" | "A" | "D" | "R" | undefined

export const hasFileChanges = (fileStatus: GitFileStatus | undefined): boolean => {
  if (fileStatus === undefined) {
    return false
  }
  const { index, workingDir } = fileStatus
  return !isUnchangedStatus(index) || !isUnchangedStatus(workingDir)
}

export const getGitStatusForDisplay = (
  fileStatus: GitFileStatus | undefined,
): GitFileStatusForDisplay => {
  if (fileStatus === undefined) {
    return undefined
  }

  const { index, workingDir } = fileStatus

  switch (workingDir) {
    case " ":
      switch (index) {
        case " ":
          return undefined
        case "M":
          return "M"
        case "A":
          return "A"
        case "D":
          return "D"
        case "R":
          return "R"
        case "?":
          return "U"
        default:
          return undefined
      }
    case "M":
      return "M"
    case "A":
      return "A"
    case "D":
      return "D"
    case "R":
      return "R"
    case "?":
      return "U"
    default:
      return undefined
  }
}

export const getLabelForGitStatus = (status: GitFileStatusForDisplay): string => {
  switch (status) {
    case "U":
      return "untracked"
    case "M":
      return "modified"
    case "A":
      return "added"
    case "D":
      return "deleted"
    case "R":
      return "renamed"
    default:
      return ""
  }
}

const remotePattern = /^remotes\/(\w+?)\/(.+)$/

export const splitBranchName = (branch: string): { remote?: string; name: string } => {
  const [_, remote, actualBranch] = branch.match(remotePattern) ?? ["", undefined, branch]
  return { remote, name: actualBranch }
}
