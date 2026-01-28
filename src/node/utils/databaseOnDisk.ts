import { error, isError, ok, type Result } from "@elyukai/utils/result"
import type { InstanceContent } from "../../shared/utils/instances.ts"
import type { EntityDecl } from "../schema/index.ts"
import type { TransactionStep } from "../transaction.ts"
import * as DatabaseFilesystem from "./files.ts"

const setInstanceOnDisk = async (
  root: string,
  entity: EntityDecl,
  instanceId: string,
  instanceContent: InstanceContent,
): Promise<Result<void, Error>> => {
  try {
    await DatabaseFilesystem.writeInstance(root, entity, instanceId, instanceContent)
    return ok()
  } catch (e) {
    return error(e as Error)
  }
}

const deleteInstanceOnDisk = async (
  root: string,
  entityName: string,
  instanceId: string,
): Promise<Result<void, Error>> => {
  try {
    await DatabaseFilesystem.deleteInstance(root, entityName, instanceId)
    return ok()
  } catch (e) {
    return error(e as Error)
  }
}

const rollbackChanges = async (root: string, steps: TransactionStep[]) => {
  for (const step of steps) {
    const res = await runReverseStepAction(root, step)
    if (isError(res)) {
      return res
    }
  }

  return ok()
}

const runStepAction = (root: string, step: TransactionStep): Promise<Result<void, Error>> => {
  switch (step.kind) {
    case "create":
    case "update":
      return setInstanceOnDisk(root, step.entity, step.instanceId, step.instanceContent)
    case "delete":
      return deleteInstanceOnDisk(root, step.entity.name, step.instanceId)
  }
}

const runReverseStepAction = (
  root: string,
  step: TransactionStep,
): Promise<Result<void, Error>> => {
  switch (step.kind) {
    case "create":
      return deleteInstanceOnDisk(root, step.entity.name, step.instanceId)
    case "update":
      return setInstanceOnDisk(root, step.entity, step.instanceId, step.oldInstance)
    case "delete":
      return setInstanceOnDisk(root, step.entity, step.instanceId, step.oldInstance)
  }
}

export const applyStepsToDisk = async (root: string, steps: TransactionStep[]) => {
  for (let i = 0; i < steps.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const step = steps[i]!
    const res = await runStepAction(root, step)
    if (isError(res)) {
      await rollbackChanges(root, steps.slice(0, i))
      return res
    }
  }

  return ok()
}
