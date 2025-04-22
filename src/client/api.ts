import { SerializedEntityDecl } from "../schema/declarations/EntityDecl.js"
import {
  CreateInstanceOfEntityResponseBody,
  DeleteInstanceOfEntityResponseBody,
  GetAllDeclarationsResponseBody,
  GetAllInstancesOfEntityResponseBody,
  GetAllInstancesResponseBody,
  GetDeclarationResponseBody,
  GetInstanceOfEntityResponseBody,
  UpdateInstanceOfEntityResponseBody,
} from "../shared/api.js"

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
  return response.json()
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
  return response.json()
}

export const getInstancesByEntityName = async (
  name: string,
): Promise<GetAllInstancesOfEntityResponseBody> => {
  const response = await fetch(`/api/declarations/${name}/instances`)
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json()
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
  return response.json()
}

export const getInstanceByEntityNameAndId = async (
  name: string,
  id: string,
): Promise<GetInstanceOfEntityResponseBody> => {
  const response = await fetch(`/api/declarations/${name}/instances/${id}`)
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json()
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
  return response.json()
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
  return response.json()
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

  return response.json()
}
