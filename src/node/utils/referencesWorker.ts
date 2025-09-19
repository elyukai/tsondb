import { parentPort, workerData } from "node:worker_threads"
import type { InstanceContainer } from "../../shared/utils/instances.ts"
import {
  getReferencesForSerializedEntityDecl,
  isSerializedEntityDecl,
  type SerializedDecl,
} from "../schema/index.ts"
import type { ReferencesToInstances } from "./references.ts"

const declarationsByName = workerData as Record<string, SerializedDecl>

export type ReferencesWorkerTask = {
  entityName: string
  instances: InstanceContainer[]
}

const addReference = (
  acc: ReferencesToInstances,
  reference: string,
  instanceId: string,
): ReferencesToInstances => ({
  ...acc,
  [reference]: [...(acc[reference] ?? []), instanceId],
})

const addReferences = (
  acc: ReferencesToInstances,
  references: string[],
  instanceId: string,
): ReferencesToInstances =>
  references.reduce((acc1, reference) => addReference(acc1, reference, instanceId), acc)

parentPort?.on("message", (task: ReferencesWorkerTask) => {
  const entityDecl = declarationsByName[task.entityName]

  if (!entityDecl) {
    throw new Error(`entity declaration not found for entity name "${task.entityName}"`)
  }

  if (!isSerializedEntityDecl(entityDecl)) {
    throw new Error(`declaration of name "${task.entityName}" is not an entity declaration`)
  }

  const refs = task.instances.reduce((acc: ReferencesToInstances, instance) => {
    const references = getReferencesForSerializedEntityDecl(
      entityDecl,
      instance.content,
      declarationsByName,
    )
    return addReferences(acc, references, instance.id)
  }, {})
  parentPort?.postMessage(refs)
})
