import { mkdir, rm, writeFile } from "node:fs/promises"
import { basename, dirname, extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { Schema } from "../../Schema.js"
import { groupDeclarationsBySourceUrl, resolveTypeArgumentsInDecls } from "../../schema/index.js"
import { commonPrefix } from "../../shared/utils/string.js"
import { Output } from "../Output.js"
import { JsonSchemaRendererOptions, render } from "./render.js"

const extension = ".schema.json"

export const JsonSchemaOutput = (options: {
  targetPath: string
  rendererOptions?: Partial<JsonSchemaRendererOptions>
}): Output => ({
  run: async (schema: Schema): Promise<void> => {
    if (options.rendererOptions?.preserveFiles === true) {
      await rm(options.targetPath, { recursive: true, force: true })
      await mkdir(options.targetPath, { recursive: true })
      const declarationsBySourceUrl = groupDeclarationsBySourceUrl(
        resolveTypeArgumentsInDecls(schema.declarations),
      )
      const sourceRootPath = fileURLToPath(commonPrefix(...Object.keys(declarationsBySourceUrl)))
      if (sourceRootPath) {
        for (const [sourceUrl, decls] of Object.entries(declarationsBySourceUrl)) {
          const sourcePath = fileURLToPath(sourceUrl)
          const relativePath = dirname(relative(sourceRootPath, sourcePath))
          const newDir = join(options.targetPath, relativePath)
          const newPath = join(newDir, basename(sourcePath, extname(sourcePath)) + extension)
          await mkdir(newDir, { recursive: true })
          await writeFile(newPath, render(options.rendererOptions, decls!), {
            encoding: "utf-8",
          })
        }
      }
    } else {
      await mkdir(dirname(options.targetPath), { recursive: true })
      await writeFile(
        options.targetPath,
        render(options.rendererOptions, resolveTypeArgumentsInDecls(schema.declarations)),
        {
          encoding: "utf-8",
        },
      )
    }
  },
})
