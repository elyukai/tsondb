import { error, ok, type Result } from "../../../shared/utils/result.ts"
import type {
  EntityTaggedInstanceContainerWithChildInstances,
  UnsafeEntityTaggedInstanceContainerWithChildInstances,
} from "../../utils/childInstances.ts"
import type { TSONDBRequestLocals } from "../index.ts"
import { updateLocalsAfterInstanceChangeToReflectDiskState } from "./instanceOperations.ts"

export const updateLocalsAfterInstanceTreeChangeToReflectDiskState = async (
  locals: TSONDBRequestLocals,
  parentId: string | undefined,
  parentEntityName: string,
  oldChildInstances: EntityTaggedInstanceContainerWithChildInstances[],
  childInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[],
): Promise<Result<void, [code: number, message: string]>> => {
  const parentEntity = locals.entitiesByName[parentEntityName]

  if (parentEntity === undefined) {
    return error([400, `Unknown entity "${parentEntityName}"`])
  }

  if (parentId !== undefined) {
    // existing parent, some child instances may already exist
    for (const oldChildInstance of oldChildInstances) {
      const newChildInstance = childInstances.find(ci => ci.id === oldChildInstance.id)

      if (newChildInstance === undefined) {
        await updateLocalsAfterInstanceChangeToReflectDiskState(
          locals,
          oldChildInstance.entityName,
          oldChildInstance.id,
          undefined,
        )
      } else {
        await updateLocalsAfterInstanceChangeToReflectDiskState(
          locals,
          oldChildInstance.entityName,
          oldChildInstance.id,
          newChildInstance.content,
        )
      }
    }

    for (const newChildInstance of childInstances.filter(predicate => predicate.id === undefined)) {
      if (newChildInstance.id !== undefined) {
        await updateLocalsAfterInstanceChangeToReflectDiskState(
          locals,
          newChildInstance.entityName,
          newChildInstance.id,
          newChildInstance.content,
        )
      }
    }
  } else {
    // new parent, all child instances are new
    for (const newChildInstance of childInstances) {
      if (newChildInstance.id !== undefined) {
        await updateLocalsAfterInstanceChangeToReflectDiskState(
          locals,
          newChildInstance.entityName,
          newChildInstance.id,
          newChildInstance.content,
        )
      }
    }
  }

  // check recursively for child instances of child instances
  for (const childInstance of childInstances) {
    const oldChildInstance = childInstance.id
      ? oldChildInstances.find(ci => ci.id === childInstance.id)
      : undefined

    await updateLocalsAfterInstanceTreeChangeToReflectDiskState(
      locals,
      childInstance.id,
      childInstance.entityName,
      oldChildInstance ? oldChildInstance.childInstances : [],
      childInstance.childInstances,
    )
  }

  return ok()
}
