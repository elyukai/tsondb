import { SerializedEntityDecl } from "../schema/index.js"
import { InstanceContainer } from "../utils/instances.js"

export const getAllEntities = async (): Promise<SerializedEntityDecl[]> => {
  const response = await fetch("/api/entities")
  if (!response.ok) {
    throw new Error("Failed to fetch entities")
  }
  return response.json()
}

export const getEntityByName = async (name: string): Promise<SerializedEntityDecl> => {
  const response = await fetch(`/api/entities/${name}`)
  if (!response.ok) {
    throw new Error("Failed to fetch entity")
  }
  return response.json()
}

export const getInstancesByEntityName = async (name: string): Promise<InstanceContainer[]> => {
  const response = await fetch(`/api/entities/${name}/instances`)
  if (!response.ok) {
    throw new Error("Failed to fetch instances")
  }
  return response.json()
}

export const getInstanceByEntityNameAndId = async (
  name: string,
  id: string,
): Promise<InstanceContainer> => {
  const response = await fetch(`/api/entities/${name}/instances/${id}`)
  if (!response.ok) {
    throw new Error("Failed to fetch instance")
  }
  return response.json()
}
