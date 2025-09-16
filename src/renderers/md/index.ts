import { mkdir, writeFile } from "fs/promises"
import { dirname } from "path"
import { Schema } from "../../Schema.js"
import { Output } from "../Output.js"
import { MarkdownRendererOptions, render } from "./render.js"

export const MarkdownOutput = (options: {
  targetPath: string
  rendererOptions?: MarkdownRendererOptions
}): Output => ({
  run: async (schema: Schema): Promise<void> => {
    await mkdir(dirname(options.targetPath), { recursive: true })
    await writeFile(options.targetPath, render(options.rendererOptions, schema.declarations), {
      encoding: "utf-8",
    })
  },
})
