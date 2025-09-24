import type {
  CreateBranchRequestBody,
  CreateCommitRequestBody,
  CreateInstanceOfEntityResponseBody,
  DeleteInstanceOfEntityResponseBody,
  GetAllDeclarationsResponseBody,
  GetAllGitBranchesResponseBody,
  GetAllInstancesOfEntityResponseBody,
  GetAllInstancesResponseBody,
  GetDeclarationResponseBody,
  GetInstanceOfEntityResponseBody,
  GitStatusResponseBody,
  UpdateInstanceOfEntityResponseBody,
} from "../shared/api.ts"
import type { SerializedEntityDecl } from "../shared/schema/declarations/EntityDecl.ts"

export const getAllDeclarations = async (
  kind?: "Entity" | "Enum" | "TypeAlias",
): Promise<GetAllDeclarationsResponseBody> => {
  const url = new URL("/api/declarations", window.location.origin)
  if (kind) {
    url.searchParams.append("kind", kind)
  }
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<GetAllDeclarationsResponseBody>
}

export const getAllEntities = (): Promise<GetAllDeclarationsResponseBody<SerializedEntityDecl>> =>
  getAllDeclarations("Entity") as Promise<GetAllDeclarationsResponseBody<SerializedEntityDecl>>

export const getEntityByName = async (
  name: string,
): Promise<GetDeclarationResponseBody<SerializedEntityDecl>> => {
  const response = await fetch(`/api/declarations/${name}`)
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<GetDeclarationResponseBody<SerializedEntityDecl>>
}

export const getInstancesByEntityName = async (
  name: string,
): Promise<GetAllInstancesOfEntityResponseBody> => {
  const response = await fetch(`/api/declarations/${name}/instances`)
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<GetAllInstancesOfEntityResponseBody>
}

export const createInstanceByEntityNameAndId = async (
  name: string,
  content: unknown,
  id?: string,
): Promise<CreateInstanceOfEntityResponseBody> => {
  const url = new URL(`/api/declarations/${name}/instances`, window.location.origin)
  if (id) {
    url.searchParams.append("id", id)
  }
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(content),
    headers: {
      "Content-Type": "application/json",
    },
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<CreateInstanceOfEntityResponseBody>
}

export const getInstanceByEntityNameAndId = async (
  name: string,
  id: string,
): Promise<GetInstanceOfEntityResponseBody> => {
  const response = await fetch(`/api/declarations/${name}/instances/${id}`)
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<GetInstanceOfEntityResponseBody>
}

export const updateInstanceByEntityNameAndId = async (
  name: string,
  id: string,
  content: unknown,
): Promise<UpdateInstanceOfEntityResponseBody> => {
  const response = await fetch(`/api/declarations/${name}/instances/${id}`, {
    method: "PUT",
    body: JSON.stringify(content),
    headers: {
      "Content-Type": "application/json",
    },
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<UpdateInstanceOfEntityResponseBody>
}

export const deleteInstanceByEntityNameAndId = async (
  name: string,
  id: string,
): Promise<DeleteInstanceOfEntityResponseBody> => {
  const response = await fetch(`/api/declarations/${name}/instances/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<DeleteInstanceOfEntityResponseBody>
}

export const getAllInstances = async (locales: string[]): Promise<GetAllInstancesResponseBody> => {
  const url = new URL("/api/instances", window.location.origin)

  for (const locale of locales) {
    url.searchParams.append("locales", locale)
  }

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json() as Promise<GetAllInstancesResponseBody>
}

export const getGitStatus = async (): Promise<GitStatusResponseBody> => {
  const url = new URL("/api/git/status", window.location.origin)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json() as Promise<GitStatusResponseBody>
}

export const stageAllFiles = async (): Promise<void> => {
  const response = await fetch(`/api/git/stage`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const stageAllFilesOfEntity = async (entityName: string): Promise<void> => {
  const response = await fetch(`/api/git/stage/${entityName}`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const stageFileOfEntity = async (entityName: string, id: string): Promise<void> => {
  const response = await fetch(`/api/git/stage/${entityName}/${id}`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const unstageAllFiles = async (): Promise<void> => {
  const response = await fetch(`/api/git/unstage`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const unstageAllFilesOfEntity = async (entityName: string): Promise<void> => {
  const response = await fetch(`/api/git/unstage/${entityName}`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const unstageFileOfEntity = async (entityName: string, id: string): Promise<void> => {
  const response = await fetch(`/api/git/unstage/${entityName}/${id}`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const commitStagedFiles = async (
  message: string,
): Promise<DeleteInstanceOfEntityResponseBody> => {
  const body: CreateCommitRequestBody = { message }
  const response = await fetch(`/api/git/commit`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<DeleteInstanceOfEntityResponseBody>
}

export const pushCommits = async (): Promise<DeleteInstanceOfEntityResponseBody> => {
  const response = await fetch(`/api/git/push`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<DeleteInstanceOfEntityResponseBody>
}

export const pullCommits = async (): Promise<DeleteInstanceOfEntityResponseBody> => {
  const response = await fetch(`/api/git/pull`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<DeleteInstanceOfEntityResponseBody>
}

export const getBranches = async (): Promise<GetAllGitBranchesResponseBody> => {
  const response = await fetch(`/api/git/branch`, {
    method: "GET",
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<GetAllGitBranchesResponseBody>
}

export const createBranch = async (branchName: string): Promise<void> => {
  const body: CreateBranchRequestBody = { branchName }
  const response = await fetch(`/api/git/branch`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const switchBranch = async (branchName: string): Promise<void> => {
  const response = await fetch(`/api/git/branch/${branchName}`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}
