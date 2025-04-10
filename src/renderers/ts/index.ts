import { mkdir, writeFile } from "fs/promises"
import { dirname } from "path"
import { Schema } from "../../Schema.js"
import { Output } from "../Output.js"
import { render, TypeScriptRendererOptions } from "./render.js"

export const TypeScriptOutput = (options: {
  targetPath: string
  rendererOptions?: TypeScriptRendererOptions
}): Output => ({
  run: async (schema: Schema): Promise<void> => {
    await mkdir(dirname(options.targetPath), { recursive: true })
    await writeFile(options.targetPath, render(options.rendererOptions, schema.declarations), {
      encoding: "utf-8",
    })
  },
})
