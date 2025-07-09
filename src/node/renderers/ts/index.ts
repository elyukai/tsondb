import Debug from "debug"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { basename, dirname, extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { commonPrefix } from "../../../shared/utils/string.js"
import type { Schema } from "../../Schema.js"
import { groupDeclarationsBySourceUrl } from "../../schema/declarations/Declaration.js"
import type { Output } from "../Output.js"
import type { TypeScriptRendererOptions } from "./render.js"
import { render } from "./render.js"

const debug = Debug("tsondb:renderer:ts")

const extension = ".d.ts"

export const TypeScriptOutput = (options: {
  targetPath: string
  rendererOptions?: Partial<TypeScriptRendererOptions>
}): Output => ({
  run: async (schema: Schema): Promise<void> => {
    if (options.rendererOptions?.preserveFiles === true) {
      debug("emitting declarations to multiple files...")
      await rm(options.targetPath, { recursive: true, force: true })
      await mkdir(options.targetPath, { recursive: true })
      const declarationsBySourceUrl = groupDeclarationsBySourceUrl(schema.declarations)
      const sourceRootPath = fileURLToPath(commonPrefix(...Object.keys(declarationsBySourceUrl)))
      debug("common source root path: %s", sourceRootPath)
      if (sourceRootPath) {
        for (const [sourceUrl, decls] of Object.entries(declarationsBySourceUrl)) {
          const sourcePath = fileURLToPath(sourceUrl)
          const relativePath = dirname(relative(sourceRootPath, sourcePath))
          const newDir = join(options.targetPath, relativePath)
          const newPath = join(newDir, basename(sourcePath, extname(sourcePath)) + extension)
          await mkdir(newDir, { recursive: true })
          await writeFile(newPath, render(options.rendererOptions, decls ?? []), {
            encoding: "utf-8",
          })
        }
        debug("emitted declaration files to %s", options.targetPath)
      }
    } else {
      debug("emitting declarations to single file...")
      await mkdir(dirname(options.targetPath), { recursive: true })
      await writeFile(options.targetPath, render(options.rendererOptions, schema.declarations), {
        encoding: "utf-8",
      })
      debug("emitted declarations to %s", options.targetPath)
    }
  },
})
