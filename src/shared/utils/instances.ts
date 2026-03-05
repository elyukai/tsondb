import type { GitFileStatus } from "./git.ts"

export type InstanceContent = object

export interface InstanceContainer<T = InstanceContent> {
  id: string
  content: T
  gitStatus?: GitFileStatus
}

export interface InstanceContainerOverview {
  id: string
  gitStatus?: GitFileStatus
  displayName: string
  displayNameLocaleId?: string
}
