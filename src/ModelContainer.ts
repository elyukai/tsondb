import { mkdir, readdir, readFile } from "fs/promises"
import { join } from "path"
import { Output } from "./renderers/Output.js"
import { Schema } from "./Schema.js"
import { isEntityDecl, validateEntityDecl } from "./schema/index.js"
import { getErrorMessageForDisplay } from "./utils/error.js"

export interface ModelContainer {
  schema: Schema
  outputs: Output[]
  dataRootPath: string
}

export const ModelContainer = (options: {
  schema: Schema
  outputs: Output[]
  dataRootPath: string
}): ModelContainer => ({
  ...options,
})

export const run = async (modelContainer: ModelContainer): Promise<void> => {
  for (const output of modelContainer.outputs) {
    await output.run(modelContainer.schema)
  }

  const entities = modelContainer.schema.declarations.values().toArray().filter(isEntityDecl)

  await mkdir(modelContainer.dataRootPath, { recursive: true })

  for (const entity of entities) {
    const entityDir = join(modelContainer.dataRootPath, entity.name)
    await mkdir(entityDir, { recursive: true })
  }

  const readInstancesOfEntity = async (entityName: string) => {
    const entityDir = join(modelContainer.dataRootPath, entityName)
    const instances = await readdir(entityDir)
    return Promise.all(
      instances.map(
        async instance => JSON.parse(await readFile(join(entityDir, instance), "utf-8")) as unknown,
      ),
    )
  }

  const instancesByEntityName = Object.fromEntries(
    await Promise.all(
      entities.map(async entity => {
        const instances = await readInstancesOfEntity(entity.name)
        return [entity.name, instances] as [string, unknown[]]
      }),
    ),
  )

  const errors = entities.flatMap(entity =>
    instancesByEntityName[entity.name]!.flatMap(instance =>
      validateEntityDecl(
        {
          checkReferentialIntegrity: ({ name, values }) =>
            instancesByEntityName[name]!.some(
              instance =>
                typeof instance === "object" &&
                instance !== null &&
                !Array.isArray(instance) &&
                values.every(
                  ([key, value]) => (instance as Record<typeof key, unknown>)[key] === value,
                ),
            )
              ? []
              : [
                  ReferenceError(
                    `Invalid reference to instance of entity "${name}" with identifier ${JSON.stringify(
                      Object.fromEntries(values),
                    )}`,
                  ),
                ],
        },
        entity,
        [],
        instance,
      ),
    ),
  )

  if (errors.length === 0) {
    console.log("All entities are valid")
  } else {
    console.error("Errors:\n\n")
    for (const error of errors) {
      console.error(getErrorMessageForDisplay(error) + "\n")
    }
    throw new Error("Validation failed")
  }
}
