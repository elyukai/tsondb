import { mkdir, writeFile } from "fs/promises"
import { dirname } from "path"
import { Schema } from "../../Schema.js"
import { resolveTypeArgumentsInDecls } from "../../schema/index.js"
import { Output } from "../Output.js"
import { JsonSchemaRendererOptions, render } from "./render.js"

export const JsonSchemaOutput = (options: {
  targetPath: string
  rendererOptions?: JsonSchemaRendererOptions
}): Output => ({
  run: async (schema: Schema): Promise<void> => {
    await mkdir(dirname(options.targetPath), { recursive: true })
    await writeFile(
      options.targetPath,
      render(options.rendererOptions, resolveTypeArgumentsInDecls(schema.declarations)),
      {
        encoding: "utf-8",
      },
    )
  },
})
