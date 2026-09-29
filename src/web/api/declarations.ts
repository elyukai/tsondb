import type {
  CreateInstanceOfEntityRequestBody,
  CreateInstanceOfEntityResponseBody,
  CreateSingletonInstanceOfEntityRequestBody,
  CreateSingletonInstanceOfEntityResponseBody,
  DeleteInstanceOfEntityResponseBody,
  DeleteSingletonInstanceOfEntityResponseBody,
  GetAllChildInstancesOfInstanceResponseBody,
  GetAllDeclarationsResponseBody,
  GetAllEntityDeclarationsResponseBody,
  GetAllInstancesOfEntityResponseBody,
  GetAllSingletonEntityDeclarationsResponseBody,
  GetDeclarationResponseBody,
  GetInstanceOfEntityResponseBody,
  GetSingletonInstanceOfEntityResponseBody,
  UpdateInstanceOfEntityRequestBody,
  UpdateInstanceOfEntityResponseBody,
  UpdateSingletonInstanceOfEntityRequestBody,
  UpdateSingletonInstanceOfEntityResponseBody,
} from "../../shared/api.ts"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"
import type { SerializedEnumDecl } from "../../shared/schema/declarations/EnumDecl.ts"
import type { SerializedTypeAliasDecl } from "../../shared/schema/declarations/TypeAliasDecl.ts"
import type {
  CreatedEntityTaggedInstanceContainerWithChildInstances,
  EntityTaggedSingletonInstanceContainer,
  UpdatedEntityTaggedInstanceContainerWithChildInstances,
} from "../../shared/utils/childInstances.ts"
import { deleteResource, getResource, postResource, putResource } from "../utils/api.ts"

type DeclKind = "Entity" | "SingletonEntity" | "Enum" | "TypeAlias"

type ResponseTypeForKind<K extends DeclKind | undefined> = K extends "Entity"
  ? GetAllEntityDeclarationsResponseBody
  : K extends "SingletonEntity"
    ? GetAllSingletonEntityDeclarationsResponseBody
    : K extends "Enum"
      ? GetAllDeclarationsResponseBody<SerializedEnumDecl>
      : K extends "TypeAlias"
        ? GetAllDeclarationsResponseBody<SerializedTypeAliasDecl>
        : GetAllDeclarationsResponseBody

export const getAllDeclarations: {
  (locales: string[], kind?: undefined): Promise<GetAllDeclarationsResponseBody>
  <D extends DeclKind>(locales: string[], kind: D): Promise<ResponseTypeForKind<D>>
} = async <D extends DeclKind | undefined>(locales: string[], kind: D) =>
  getResource<ResponseTypeForKind<D>>("/api/declarations", {
    locales,
    modifyUrl: url => {
      if (kind) {
        url.searchParams.append("kind", kind)
      }
    },
  })

export const getAllEntities = (locales: string[]) => getAllDeclarations(locales, "Entity")

export const getAllSingletonEntities = (locales: string[]) =>
  getAllDeclarations(locales, "SingletonEntity")

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

export const getSingletonInstanceByEntityName = async (locales: string[], name: string) =>
  getResource<GetSingletonInstanceOfEntityResponseBody>(`/api/declarations/${name}/instance`, {
    locales,
  })

export const createSingletonInstanceByEntityName = async (
  locales: string[],
  name: string,
  content: EntityTaggedSingletonInstanceContainer,
) => {
  const body: CreateSingletonInstanceOfEntityRequestBody = {
    instance: content,
  }

  return postResource<CreateSingletonInstanceOfEntityResponseBody>(
    `/api/declarations/${name}/instance`,
    {
      locales,
      body,
    },
  )
}

export const updateSingletonInstanceByEntityName = async (
  locales: string[],
  name: string,
  content: EntityTaggedSingletonInstanceContainer,
) => {
  const body: UpdateSingletonInstanceOfEntityRequestBody = {
    instance: content,
  }

  return putResource<UpdateSingletonInstanceOfEntityResponseBody>(
    `/api/declarations/${name}/instance`,
    {
      locales,
      body,
    },
  )
}

export const deleteSingletonInstanceByEntityName = async (locales: string[], name: string) =>
  deleteResource<DeleteSingletonInstanceOfEntityResponseBody>(
    `/api/declarations/${name}/instance`,
    {
      locales,
    },
  )
