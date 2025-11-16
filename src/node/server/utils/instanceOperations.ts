import { removeAt } from "../../../shared/utils/array.ts"
import type { InstanceContainer } from "../../../shared/utils/instances.ts"
import { error, isError, ok, type Result } from "../../../shared/utils/result.ts"
import {
  checkWriteInstanceTreePossible,
  getChildInstances,
  unsafeApplyInstanceTree,
  type CreatedEntityTaggedInstanceContainerWithChildInstances,
  type UpdatedEntityTaggedInstanceContainerWithChildInstances,
} from "../../utils/childInstances.ts"
import { getFileNameForId } from "../../utils/files.ts"
import { getGitFileStatusFromStatusResult } from "../../utils/git.ts"
import * as Instances from "../../utils/instanceOperations.ts"
import { updateReferencesToInstances } from "../../utils/references.ts"
import type { TSONDBRequestLocals } from "../index.ts"
import { updateLocalsAfterInstanceTreeChangeToReflectDiskState } from "./childInstances.ts"

export const updateLocalsAfterInstanceChangeToReflectDiskState = async (
  locals: TSONDBRequestLocals,
  entityName: string,
  instanceId: string,
  newInstanceContent: unknown,
) => {
  const oldInstances = locals.instancesByEntityName[entityName] ?? []
  const oldInstanceContainerIndex = oldInstances.findIndex(instance => instance.id === instanceId)
  const oldInstanceContainer =
    oldInstanceContainerIndex > -1 ? oldInstances[oldInstanceContainerIndex] : undefined

  const instanceContainer: InstanceContainer = oldInstanceContainer ?? {
    id: instanceId,
    content: undefined,
  }

  // old content as alternative if instance is deleted to restore old instance container
  instanceContainer.content = newInstanceContent ?? instanceContainer.content
  instanceContainer.gitStatus =
    locals.gitRoot === undefined
      ? undefined
      : getGitFileStatusFromStatusResult(
          await locals.git.status(),
          locals.gitRoot,
          locals.dataRoot,
          entityName,
          getFileNameForId(instanceId),
        )

  if (oldInstanceContainer === undefined) {
    locals.instancesByEntityName[entityName] = [...oldInstances, instanceContainer]
  } else if (newInstanceContent === undefined) {
    locals.instancesByEntityName[entityName] = removeAt(oldInstances, oldInstanceContainerIndex)
  }

  Object.assign(
    locals.referencesToInstances,
    updateReferencesToInstances(
      locals.entitiesByName,
      locals.referencesToInstances,
      entityName,
      instanceId,
      oldInstanceContainer?.content,
      newInstanceContent,
    ),
  )

  return instanceContainer
}

export const createInstance = async (
  locals: TSONDBRequestLocals,
  instance: CreatedEntityTaggedInstanceContainerWithChildInstances,
  idQueryParam: unknown,
): Promise<Result<InstanceContainer, [code: number, message: string]>> => {
  const entity = locals.entitiesByName[instance.entityName]

  if (entity === undefined) {
    return error([400, "Entity not found"])
  }

  const checkTreeResult = checkWriteInstanceTreePossible(
    locals.entitiesByName,
    locals.instancesByEntityName,
    locals.referencesToInstances,
    instance.id,
    entity.name,
    [],
    instance.childInstances,
  )

  if (isError(checkTreeResult)) {
    return checkTreeResult
  }

  const res = await Instances.createInstance(
    locals.dataRoot,
    locals.localeEntity,
    locals.instancesByEntityName,
    entity,
    instance.content,
    idQueryParam,
  )

  if (isError(res)) {
    return res
  }

  const newInstanceId = res.value

  const treeRes = await unsafeApplyInstanceTree(
    locals.dataRoot,
    locals.entitiesByName,
    locals.instancesByEntityName,
    newInstanceId,
    instance.entityName,
    [],
    instance.childInstances,
  )

  if (isError(treeRes)) {
    return treeRes
  }

  const instanceContainer = await updateLocalsAfterInstanceChangeToReflectDiskState(
    locals,
    entity.name,
    newInstanceId,
    instance.content,
  )

  await updateLocalsAfterInstanceTreeChangeToReflectDiskState(
    locals,
    newInstanceId,
    entity.name,
    [],
    instance.childInstances,
  )

  return ok(instanceContainer)
}

export const updateInstance = async (
  locals: TSONDBRequestLocals,
  instance: UpdatedEntityTaggedInstanceContainerWithChildInstances,
): Promise<Result<InstanceContainer, [code: number, message: string]>> => {
  const instanceContainer = locals.instancesByEntityName[instance.entityName]?.find(
    instance => instance.id === instance.id,
  )

  if (instanceContainer === undefined) {
    return error([404, "Instance not found"])
  }

  const entity = locals.entitiesByName[instance.entityName]

  if (entity === undefined) {
    return error([400, "Entity not found"])
  }

  const oldChildInstances = getChildInstances(locals.instancesByEntityName, entity, instance.id)

  const checkTreeResult = checkWriteInstanceTreePossible(
    locals.entitiesByName,
    locals.instancesByEntityName,
    locals.referencesToInstances,
    instance.id,
    entity.name,
    oldChildInstances,
    instance.childInstances,
  )

  if (isError(checkTreeResult)) {
    return checkTreeResult
  }

  const res = await Instances.updateInstance(
    locals.dataRoot,
    locals.instancesByEntityName,
    entity,
    instance.id,
    instance.content,
  )

  if (isError(res)) {
    return res
  }

  const treeRes = await unsafeApplyInstanceTree(
    locals.dataRoot,
    locals.entitiesByName,
    locals.instancesByEntityName,
    instance.id,
    instance.entityName,
    oldChildInstances,
    instance.childInstances,
  )

  if (isError(treeRes)) {
    return treeRes
  }

  const newInstanceContainer = await updateLocalsAfterInstanceChangeToReflectDiskState(
    locals,
    entity.name,
    instance.id,
    instance.content,
  )

  await updateLocalsAfterInstanceTreeChangeToReflectDiskState(
    locals,
    instance.id,
    instance.entityName,
    oldChildInstances,
    instance.childInstances,
  )

  return ok(newInstanceContainer)
}

export const deleteInstance = async (
  locals: TSONDBRequestLocals,
  entityName: string,
  instanceId: string,
): Promise<Result<InstanceContainer, [code: number, message: string]>> => {
  const instances = locals.instancesByEntityName[entityName] ?? []
  const instanceContainerIndex = instances.findIndex(instance => instance.id === instanceId)
  const instanceContainer = instances[instanceContainerIndex]

  if (instanceContainer === undefined) {
    return error([404, "Instance not found"])
  }

  const entity = locals.entitiesByName[entityName]

  if (entity === undefined) {
    return error([400, "Entity not found"])
  }

  const oldChildInstances = getChildInstances(
    locals.instancesByEntityName,
    entity,
    instanceContainer.id,
  )

  const checkTreeResult = checkWriteInstanceTreePossible(
    locals.entitiesByName,
    locals.instancesByEntityName,
    locals.referencesToInstances,
    instanceContainer.id,
    entityName,
    oldChildInstances,
    [],
  )

  if (isError(checkTreeResult)) {
    return checkTreeResult
  }

  const res = await Instances.deleteInstance(
    locals.dataRoot,
    locals.referencesToInstances,
    entityName,
    instanceId,
  )

  if (isError(res)) {
    return res
  }

  const treeRes = await unsafeApplyInstanceTree(
    locals.dataRoot,
    locals.entitiesByName,
    locals.instancesByEntityName,
    instanceContainer.id,
    entityName,
    oldChildInstances,
    [],
  )

  if (isError(treeRes)) {
    return treeRes
  }

  const oldInstanceContainer = await updateLocalsAfterInstanceChangeToReflectDiskState(
    locals,
    entity.name,
    instanceContainer.id,
    undefined,
  )

  await updateLocalsAfterInstanceTreeChangeToReflectDiskState(
    locals,
    instanceContainer.id,
    entityName,
    oldChildInstances,
    [],
  )

  return ok(oldInstanceContainer)
}
