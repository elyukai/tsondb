import { error, ok } from "@elyukai/utils/result"
import type { FormatterOptions } from "../config.ts"
import type { TransactionStep } from "../transaction.ts"
import * as DatabaseFilesystem from "./files.ts"

const rollbackChanges = async (
  root: string,
  steps: TransactionStep[],
  formatterOptions: Partial<FormatterOptions> | undefined,
) => {
  for (const step of steps) {
    try {
      await runReverseStepAction(root, step, formatterOptions)
    } catch (e: unknown) {
      return error(e as Error)
    }
  }

  return ok()
}

const runStepAction = (
  root: string,
  step: TransactionStep,
  formatterOptions: Partial<FormatterOptions> | undefined,
): Promise<void> => {
  switch (step.kind) {
    case "create":
    case "update":
      return DatabaseFilesystem.writeInstance(
        root,
        step.entity,
        step.instanceId,
        step.instanceContent,
        formatterOptions,
      )
    case "delete":
      return DatabaseFilesystem.deleteInstance(root, step.entity.name, step.instanceId)
    case "createSingleton":
    case "updateSingleton":
      return DatabaseFilesystem.writeSingletonInstance(
        root,
        step.entity,
        step.instanceContent,
        formatterOptions,
      )
    case "deleteSingleton":
      return DatabaseFilesystem.deleteSingletonInstance(root, step.entity.name)
  }
}

const runReverseStepAction = (
  root: string,
  step: TransactionStep,
  formatterOptions: Partial<FormatterOptions> | undefined,
): Promise<void> => {
  switch (step.kind) {
    case "create":
      return DatabaseFilesystem.deleteInstance(root, step.entity.name, step.instanceId)
    case "update":
      return DatabaseFilesystem.writeInstance(
        root,
        step.entity,
        step.instanceId,
        step.oldInstance,
        formatterOptions,
      )
    case "delete":
      return DatabaseFilesystem.writeInstance(
        root,
        step.entity,
        step.instanceId,
        step.oldInstance,
        formatterOptions,
      )
    case "createSingleton":
      return DatabaseFilesystem.deleteSingletonInstance(root, step.entity.name)
    case "updateSingleton":
      return DatabaseFilesystem.writeSingletonInstance(
        root,
        step.entity,
        step.oldInstance,
        formatterOptions,
      )
    case "deleteSingleton":
      return DatabaseFilesystem.writeSingletonInstance(
        root,
        step.entity,
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

    try {
      await runStepAction(root, step, formatterOptions)
    } catch (e: unknown) {
      await rollbackChanges(root, steps.slice(0, i), formatterOptions)
      return error(e as Error)
    }
  }

  return ok()
}
