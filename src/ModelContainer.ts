import { mkdir, readdir, readFile } from "fs/promises"
import { join } from "path"
import { Output } from "./renderers/Output.js"
import { Schema } from "./Schema.js"
import { isEntityDecl, validateEntityDecl } from "./schema/index.js"
import { parallelizeErrors } from "./schema/validation/type.js"
import { getErrorMessageForDisplay, wrapErrorsIfAny } from "./utils/error.js"

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
    const instanceFileNames = await readdir(entityDir)
    return Promise.all(
      instanceFileNames.map(async instanceFileName => ({
        fileName: instanceFileName,
        content: JSON.parse(await readFile(join(entityDir, instanceFileName), "utf-8")) as unknown,
      })),
    )
  }

  const instancesByEntityName = Object.fromEntries(
    await Promise.all(
      entities.map(async entity => {
        const instances = await readInstancesOfEntity(entity.name)
        return [entity.name, instances] as [string, { fileName: string; content: unknown }[]]
      }),
    ),
  )

  const errors = entities.flatMap(entity =>
    parallelizeErrors(
      instancesByEntityName[entity.name]!.map(instance =>
        wrapErrorsIfAny(
          `in file "${entity.name}/${instance.fileName}"`,
          validateEntityDecl(
            {
              checkReferentialIntegrity: ({ name, values }) =>
                instancesByEntityName[name]!.some(
                  instance =>
                    typeof instance.content === "object" &&
                    instance.content !== null &&
                    !Array.isArray(instance.content) &&
                    values.every(
                      ([key, value]) =>
                        (instance.content as Record<typeof key, unknown>)[key] === value,
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
            instance.content,
          ),
        ),
      ),
    ),
  )

  if (errors.length === 0) {
    console.log("All entities are valid")
  } else {
    console.error("Errors:\n")
    for (const error of errors) {
      console.error(getErrorMessageForDisplay(error) + "\n")
    }
    throw new Error("Validation failed")
  }
}
