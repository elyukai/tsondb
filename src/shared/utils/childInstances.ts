import type { GitFileStatus } from "./git.ts"
import type { InstanceContent } from "./instances.ts"

export interface ChildInstanceContainer {
  id?: string
  content: InstanceContent
  gitStatus?: GitFileStatus
}

export interface EntityTaggedInstanceContainer {
  entityName: string
  id: string
  content: InstanceContent
}

export interface CreatedEntityTaggedInstanceContainerWithChildInstances extends GenEntityTaggedInstanceContainerWithChildInstances<
  undefined,
  UnsafeEntityTaggedInstanceContainerWithChildInstances
> {}

export interface UpdatedEntityTaggedInstanceContainerWithChildInstances extends GenEntityTaggedInstanceContainerWithChildInstances<
  string,
  UnsafeEntityTaggedInstanceContainerWithChildInstances
> {}

export interface UnsafeEntityTaggedInstanceContainerWithChildInstances extends GenEntityTaggedInstanceContainerWithChildInstances<
  string | undefined,
  UnsafeEntityTaggedInstanceContainerWithChildInstances
> {}

export interface EntityTaggedInstanceContainerWithChildInstances extends GenEntityTaggedInstanceContainerWithChildInstances<
  string,
  EntityTaggedInstanceContainerWithChildInstances
> {}

export interface GenEntityTaggedInstanceContainerWithChildInstances<
  ID extends string | undefined,
  C,
> {
  entityName: string
  id: ID
  content: InstanceContent
  childInstances: C[]
}
