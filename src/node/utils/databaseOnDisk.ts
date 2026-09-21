import { error, isError, ok, type Result } from "@elyukai/utils/result"
import type { InstanceContent } from "../../shared/utils/instances.ts"
import type { FormatterOptions } from "../config.ts"
import type { EntityDecl } from "../schema/dsl/index.ts"
import type { TransactionStep } from "../transaction.ts"
import * as DatabaseFilesystem from "./files.ts"

const setInstanceOnDisk = async (
  root: string,
  entity: EntityDecl,
  instanceId: string,
  instanceContent: InstanceContent,
  formatterOptions: Partial<FormatterOptions> | undefined,
): Promise<Result<void, Error>> => {
  try {
    await DatabaseFilesystem.writeInstance(
      root,
      entity,
      instanceId,
      instanceContent,
      formatterOptions,
    )
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

const rollbackChanges = async (
  root: string,
  steps: TransactionStep[],
  formatterOptions: Partial<FormatterOptions> | undefined,
) => {
  for (const step of steps) {
    const res = await runReverseStepAction(root, step, formatterOptions)
    if (isError(res)) {
      return res
    }
  }

  return ok()
}

const runStepAction = (
  root: string,
  step: TransactionStep,
  formatterOptions: Partial<FormatterOptions> | undefined,
): Promise<Result<void, Error>> => {
  switch (step.kind) {
    case "create":
    case "update":
      return setInstanceOnDisk(
        root,
        step.entity,
        step.instanceId,
        step.instanceContent,
        formatterOptions,
      )
    case "delete":
      return deleteInstanceOnDisk(root, step.entity.name, step.instanceId)
  }
}

const runReverseStepAction = (
  root: string,
  step: TransactionStep,
  formatterOptions: Partial<FormatterOptions> | undefined,
): Promise<Result<void, Error>> => {
  switch (step.kind) {
    case "create":
      return deleteInstanceOnDisk(root, step.entity.name, step.instanceId)
    case "update":
      return setInstanceOnDisk(
        root,
        step.entity,
        step.instanceId,
        step.oldInstance,
        formatterOptions,
      )
    case "delete":
      return setInstanceOnDisk(
        root,
        step.entity,
        step.instanceId,
        step.oldInstance,
        formatterOptions,
      )
  }
}

export const applyStepsToDisk = async (
  root: string,
  steps: TransactionStep[],
  formatterOptions: Partial<FormatterOptions> | undefined,
) => {
  for (let i = 0; i < steps.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const step = steps[i]!
    const res = await runStepAction(root, step, formatterOptions)
    if (isError(res)) {
      await rollbackChanges(root, steps.slice(0, i), formatterOptions)
      return res
    }
  }

  return ok()
}
