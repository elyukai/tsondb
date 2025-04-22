import { SerializedDecl } from "../schema/declarations/Declaration.js"
import { InstanceContainer } from "./utils/instances.js"

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
  instances: InstanceContainer[]
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
