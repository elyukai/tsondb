import type {
  CreatedEntityTaggedInstanceContainerWithChildInstances,
  EntityTaggedInstanceContainerWithChildInstances,
  UpdatedEntityTaggedInstanceContainerWithChildInstances,
} from "../node/utils/childInstances.ts"
import type { WebConfig } from "../web/context/config.ts"
import type { SerializedDecl } from "./schema/declarations/Declaration.ts"
import type { InstanceContainer, InstanceContainerOverview } from "./utils/instances.ts"

export type GetWebConfigResponseBody = WebConfig

export interface GetAllDeclarationsResponseBody<D extends SerializedDecl = SerializedDecl> {
  declarations: { declaration: D; instanceCount: number }[]
  localeEntity?: string
}

export interface GetDeclarationResponseBody<D extends SerializedDecl = SerializedDecl> {
  declaration: D
  instanceCount: number
  isLocaleEntity: boolean
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

export interface GetAllInstancesResponseBody {
  instances: {
    [entity: string]: { id: string; name: string; displayNameLocaleId?: string }[]
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
