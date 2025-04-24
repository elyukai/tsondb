import { join } from "path"
import { StatusResult } from "simple-git"
import { GitFileStatus, GitFileStatusCode } from "../shared/utils/git.js"

export const getGitFileStatusFromStatusResult = (
  statusResult: StatusResult,
  repoRoot: string,
  dataRoot: string,
  entityName: string,
  fileName: string,
): GitFileStatus | undefined => {
  const filePath = join(dataRoot, entityName, fileName)
  const gitFile = statusResult.files.find(file => join(repoRoot, file.path) === filePath)

  if (gitFile === undefined) {
    return
  }

  return {
    index: gitFile.index as GitFileStatusCode,
    workingDir: gitFile.working_dir as GitFileStatusCode,
  }
}
