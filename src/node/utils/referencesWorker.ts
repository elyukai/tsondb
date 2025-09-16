import { parentPort } from "node:worker_threads"
import type { InstanceContainer } from "../../shared/utils/instances.ts"
import { getReferencesForEntityDecl } from "../schema/index.ts"

parentPort?.on("message", (task: InstanceContainer[]) => {
  const refs = instances.reduce((acc1, instance) => {
    const references = getReferencesForEntityDecl(entity, instance.content)
    return addReferences(acc1, references, instance.id)
  }, acc)
  parentPort?.postMessage(task.a + task.b)
})
