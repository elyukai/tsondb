import type { SerializedDecl } from "./schema/declarations/Declaration.ts"
import type { SerializedEntityDecl } from "./schema/declarations/EntityDecl.ts"
import type { SerializedSingletonEntityDecl } from "./schema/declarations/SingletonEntityDecl.ts"
import type {
  CreatedEntityTaggedInstanceContainerWithChildInstances,
  EntityTaggedInstanceContainerWithChildInstances,
  EntityTaggedSingletonInstanceContainer,
  UpdatedEntityTaggedInstanceContainerWithChildInstances,
} from "./utils/childInstances.ts"
import type {
  InstanceContainer,
  InstanceContainerOverview,
  SingletonInstanceContainer,
} from "./utils/instances.ts"

export type WebConfig = {
  localeEntityName: string | undefined
  defaultLocales: string[]
  homeLayoutSections?: { title: string; comment?: string; entities: string[] }[]
}

export type GetWebConfigResponseBody = WebConfig

export interface GetAllDeclarationsResponseBody<D extends SerializedDecl = SerializedDecl> {
  declarations: { declaration: D }[]
  localeEntity?: string
}

export interface GetAllEntityDeclarationsResponseBody<
  D extends SerializedEntityDecl = SerializedEntityDecl,
> {
  declarations: { declaration: D; instanceCount: number }[]
  localeEntity?: string
}

export interface GetAllSingletonEntityDeclarationsResponseBody<
  D extends SerializedSingletonEntityDecl = SerializedSingletonEntityDecl,
> {
  declarations: { declaration: D; hasInstance: boolean }[]
}

export interface GetDeclarationResponseBody<D extends SerializedDecl = SerializedDecl> {
  declaration: D
}

export interface GetEntityDeclarationResponseBody<
  D extends SerializedEntityDecl = SerializedEntityDecl,
> {
  declaration: D
  instanceCount: number
  isLocaleEntity: boolean
}

export interface GetSingletonEntityDeclarationResponseBody<
  D extends SerializedSingletonEntityDecl = SerializedSingletonEntityDecl,
> {
  declaration: D
  hasInstance: boolean
}

export interface GetAllInstancesOfEntityResponseBody {
  instances: InstanceContainerOverview[]
  isLocaleEntity: boolean
}

export interface GetAllChildInstancesOfInstanceResponseBody {
  instances: EntityTaggedInstanceContainerWithChildInstances[]
}

export interface CreateInstanceOfEntityRequestBody {
  instance: CreatedEntityTaggedInstanceContainerWithChildInstances
}

export interface CreateInstanceOfEntityResponseBody {
  instance: InstanceContainer
  isLocaleEntity: boolean
}

export interface ReorderAllInstancesOfEntityRequestBody {
  /**
   * All identifiers in the requested order.
   */
  order: string[]
}

export interface ReorderAllInstancesOfEntityResponseBody {
  instances: InstanceContainerOverview[]
}

export interface ReorderInstanceOfEntityRequestBody {
  /**
   * The 0-based index of the instance in the new order.
   */
  targetIndex: number
}

export interface ReorderInstanceOfEntityResponseBody {
  instances: InstanceContainerOverview[]
}

export interface GetInstanceOfEntityResponseBody {
  instance: InstanceContainer
  isLocaleEntity: boolean
}

export interface UpdateInstanceOfEntityRequestBody {
  instance: UpdatedEntityTaggedInstanceContainerWithChildInstances
}

export interface UpdateInstanceOfEntityResponseBody {
  instance: InstanceContainer
  isLocaleEntity: boolean
}

export interface DeleteInstanceOfEntityResponseBody {
  instance: InstanceContainer
  isLocaleEntity: boolean
}

export interface CreateSingletonInstanceOfEntityRequestBody {
  instance: EntityTaggedSingletonInstanceContainer
}

export interface CreateSingletonInstanceOfEntityResponseBody {
  instance: SingletonInstanceContainer
}

export interface GetSingletonInstanceOfEntityResponseBody {
  instance: SingletonInstanceContainer
}

export interface UpdateSingletonInstanceOfEntityRequestBody {
  instance: EntityTaggedSingletonInstanceContainer
}

export interface UpdateSingletonInstanceOfEntityResponseBody {
  instance: SingletonInstanceContainer
}

export interface DeleteSingletonInstanceOfEntityResponseBody {
  instance: SingletonInstanceContainer
}

export interface GetAllInstancesResponseBody {
  instances: {
    [entity: string]: { id: string; displayName: string; displayNameLocaleId?: string }[]
  }
}

export interface IsRepoResponseBody {
  isRepo: boolean
}

export interface GitStatusResponseBody {
  currentBranch: string | null
  trackingBranch: string | null
  commitsAhead: number
  commitsBehind: number
  instances: {
    [entity: string]: InstanceContainerOverview[]
  }
  latestCommit: string
}

export interface GetAllGitBranchesResponseBodyBranchSummary {
  current: boolean
  name: string
  commit: string
  label: string
  linkedWorkTree: boolean
}

export interface GetAllGitBranchesResponseBody {
  isDetached: boolean
  currentBranch: string
  allBranches: string[]
  branches: {
    [key: string]: GetAllGitBranchesResponseBodyBranchSummary
  }
}

export interface CreateCommitRequestBody {
  message: string
}

export interface CreateBranchRequestBody {
  branchName: string
}

export interface SearchResponseBody {
  query: string
  results: [entityName: string, instane: InstanceContainerOverview][]
}
