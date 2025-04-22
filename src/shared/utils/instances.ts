export interface InstanceContainer {
  fileName: string
  id: string
  content: unknown
}

export type InstancesByEntityName = Record<string, InstanceContainer[]>
