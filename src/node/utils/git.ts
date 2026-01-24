import { join } from "path"
import type { StatusResult } from "simple-git"
import type { GitFileStatus, GitFileStatusCode } from "../../shared/utils/git.ts"
import type { DatabaseInMemory } from "./databaseInMemory.ts"
import { getFileNameForId } from "./files.ts"

export const getGitFileStatusFromStatusResult = (
  gitStatus: StatusResult,
  gitRoot: string,
  dataRoot: string,
  entityName: string,
  fileName: string,
): GitFileStatus | undefined => {
  const filePath = join(dataRoot, entityName, fileName)
  const gitFile = gitStatus.files.find(file => join(gitRoot, file.path) === filePath)

  if (gitFile === undefined) {
    return
  }

  return {
    index: gitFile.index as GitFileStatusCode,
    workingDir: gitFile.working_dir as GitFileStatusCode,
  }
}

export const attachGitStatusToDatabaseInMemory = (
  databaseInMemory: DatabaseInMemory,
  dataRoot: string,
  gitRoot: string,
  gitStatus: StatusResult,
): DatabaseInMemory =>
  databaseInMemory.map((instances, entityName) =>
    instances.map(instanceContainer => ({
      ...instanceContainer,
      gitStatus: getGitFileStatusFromStatusResult(
        gitStatus,
        gitRoot,
        dataRoot,
        entityName,
        getFileNameForId(instanceContainer.id),
      ),
    })),
  )
