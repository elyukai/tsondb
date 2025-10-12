import type {
  CreateBranchRequestBody,
  CreateCommitRequestBody,
  GetAllGitBranchesResponseBody,
  GitStatusResponseBody,
  IsRepoResponseBody,
} from "../../shared/api.ts"
import { deleteResource, getResource, postResource } from "../utils/api.ts"

export const isRepo = async (locales: string[]): Promise<IsRepoResponseBody> =>
  getResource<IsRepoResponseBody>("/api/git", { locales })

export const getStatus = async (locales: string[]): Promise<GitStatusResponseBody> =>
  getResource<GitStatusResponseBody>("/api/git/status", { locales })

export const fetch = async (locales: string[]) => postResource("/api/git/fetch", { locales })

export const stageAllFiles = async (locales: string[]) =>
  postResource("/api/git/stage", { locales })

export const stageAllFilesOfEntity = async (locales: string[], entityName: string) =>
  postResource(`/api/git/stage/${entityName}`, { locales })

export const stageFileOfEntity = async (locales: string[], entityName: string, id: string) =>
  postResource(`/api/git/stage/${entityName}/${id}`, { locales })

export const unstageAllFiles = async (locales: string[]) =>
  postResource(`/api/git/unstage`, { locales })

export const unstageAllFilesOfEntity = async (locales: string[], entityName: string) =>
  postResource(`/api/git/unstage/${entityName}`, { locales })

export const unstageFileOfEntity = async (locales: string[], entityName: string, id: string) =>
  postResource(`/api/git/unstage/${entityName}/${id}`, { locales })

export const resetFileOfEntity = async (locales: string[], entityName: string, id: string) =>
  postResource(`/api/git/reset/${entityName}/${id}`, { locales })

export const commitStagedFiles = async (locales: string[], message: string) => {
  const body: CreateCommitRequestBody = { message }
  return postResource(`/api/git/commit`, { locales, body })
}

export const pushCommits = async (locales: string[]) => postResource(`/api/git/push`, { locales })

export const pullCommits = async (locales: string[]) => postResource(`/api/git/pull`, { locales })

export const getBranches = async (locales: string[]) =>
  getResource<GetAllGitBranchesResponseBody>(`/api/git/branch`, { locales })

export const createBranch = async (locales: string[], branchName: string) => {
  const body: CreateBranchRequestBody = { branchName }
  return postResource(`/api/git/branch`, { locales, body })
}

export const switchBranch = async (locales: string[], branchName: string) =>
  postResource(`/api/git/branch/${encodeURIComponent(branchName)}`, { locales })

export const deleteBranch = async (locales: string[], branchName: string) =>
  deleteResource(`/api/git/branch/${encodeURIComponent(branchName)}`, { locales })
