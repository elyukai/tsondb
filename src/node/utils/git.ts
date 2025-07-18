import { join } from "path"
import type { StatusResult } from "simple-git"
import type { GitFileStatus, GitFileStatusCode } from "../../shared/utils/git.ts"

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
