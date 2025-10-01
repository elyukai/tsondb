import type {
  CreatedEntityTaggedInstanceContainerWithChildInstances,
  UpdatedEntityTaggedInstanceContainerWithChildInstances,
} from "../../node/utils/childInstances.ts"
import type {
  CreateInstanceOfEntityRequestBody,
  CreateInstanceOfEntityResponseBody,
  DeleteInstanceOfEntityResponseBody,
  GetAllChildInstancesOfInstanceResponseBody,
  GetAllDeclarationsResponseBody,
  GetAllInstancesOfEntityResponseBody,
  GetDeclarationResponseBody,
  GetInstanceOfEntityResponseBody,
  UpdateInstanceOfEntityRequestBody,
  UpdateInstanceOfEntityResponseBody,
} from "../../shared/api.ts"
import type { SerializedDecl } from "../../shared/schema/declarations/Declaration.ts"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"
import type { SerializedEnumDecl } from "../../shared/schema/declarations/EnumDecl.ts"
import type { SerializedTypeAliasDecl } from "../../shared/schema/declarations/TypeAliasDecl.ts"
import { deleteResource, getResource, postResource, putResource } from "../utils/api.ts"

type DeclKind = "Entity" | "Enum" | "TypeAlias"

type DeclTypeForKind<K extends DeclKind | undefined> = K extends "Entity"
  ? SerializedEntityDecl
  : K extends "Enum"
    ? SerializedEnumDecl
    : K extends "TypeAlias"
      ? SerializedTypeAliasDecl
      : SerializedDecl

export const getAllDeclarations: {
  (locales: string[], kind?: undefined): Promise<GetAllDeclarationsResponseBody>
  <D extends "Entity" | "Enum" | "TypeAlias">(
    locales: string[],
    kind: D,
  ): Promise<GetAllDeclarationsResponseBody<DeclTypeForKind<D>>>
} = async <D extends "Entity" | "Enum" | "TypeAlias" | undefined>(locales: string[], kind: D) =>
  getResource<GetAllDeclarationsResponseBody<DeclTypeForKind<D>>>("/api/declarations", {
    locales,
    modifyUrl: url => {
      if (kind) {
        url.searchParams.append("kind", kind)
      }
    },
  })

export const getAllEntities = (locales: string[]) => getAllDeclarations(locales, "Entity")

export const getEntityByName = async (locales: string[], name: string) =>
  getResource<GetDeclarationResponseBody<SerializedEntityDecl>>(`/api/declarations/${name}`, {
    locales,
  })

export const getInstancesByEntityName = async (locales: string[], name: string) =>
  getResource<GetAllInstancesOfEntityResponseBody>(`/api/declarations/${name}/instances`, {
    locales,
  })

export const getLocaleInstances = (
  locales: string[],
  localeEntityName: string | undefined,
): Promise<GetAllInstancesOfEntityResponseBody> =>
  localeEntityName
    ? getInstancesByEntityName(locales, localeEntityName)
    : Promise.resolve({ instances: [], isLocaleEntity: true })

export const createInstanceByEntityNameAndId = async (
  locales: string[],
  name: string,
  content: CreatedEntityTaggedInstanceContainerWithChildInstances,
  id?: string,
) => {
  const body: CreateInstanceOfEntityRequestBody = {
    instance: content,
  }

  return postResource<CreateInstanceOfEntityResponseBody>(`/api/declarations/${name}/instances`, {
    locales,
    body,
    modifyUrl: url => {
      if (id) {
        url.searchParams.append("id", id)
      }
    },
  })
}

export const getInstanceByEntityNameAndId = async (locales: string[], name: string, id: string) =>
  getResource<GetInstanceOfEntityResponseBody>(`/api/declarations/${name}/instances/${id}`, {
    locales,
  })

export const updateInstanceByEntityNameAndId = async (
  locales: string[],
  name: string,
  id: string,
  content: UpdatedEntityTaggedInstanceContainerWithChildInstances,
) => {
  const body: UpdateInstanceOfEntityRequestBody = {
    instance: content,
  }

  return putResource<UpdateInstanceOfEntityResponseBody>(
    `/api/declarations/${name}/instances/${id}`,
    {
      locales,
      body,
    },
  )
}

export const deleteInstanceByEntityNameAndId = async (
  locales: string[],
  name: string,
  id: string,
) =>
  deleteResource<DeleteInstanceOfEntityResponseBody>(`/api/declarations/${name}/instances/${id}`, {
    locales,
  })

export const getChildInstancesForInstanceByEntityName = async (
  locales: string[],
  name: string,
  parentId: string,
) =>
  getResource<GetAllChildInstancesOfInstanceResponseBody>(
    `/api/declarations/${name}/instances/${parentId}/children`,
    {
      locales,
    },
  )
