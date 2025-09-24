import type { SerializedDecl } from "./schema/declarations/Declaration.ts"
import type { InstanceContainer, InstanceContainerOverview } from "./utils/instances.ts"

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

export interface CreateInstanceOfEntityResponseBody {
  instance: InstanceContainer
  isLocaleEntity: boolean
}

export interface GetInstanceOfEntityResponseBody {
  instance: InstanceContainer
  isLocaleEntity: boolean
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
    [entity: string]: { id: string; name: string }[]
  }
}

export interface GitStatusResponseBody {
  commitsAhead: number
  commitsBehind: number
  instances: {
    [entity: string]: InstanceContainerOverview[]
  }
}

export interface GetAllGitBranchesResponseBody {
  allBranches: string[]
  currentBranch: string
}

export interface CreateCommitRequestBody {
  message: string
}

export interface CreateBranchRequestBody {
  branchName: string
}
