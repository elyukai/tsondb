import { commonPrefix } from "@elyukai/utils/string"
import Debug from "debug"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { basename, dirname, extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import type { DefaultTSONDBTypes } from "../../index.ts"
import type { Output } from "../../output.ts"
import { groupDeclarationsBySourceUrl } from "../../schema/dsl/declarations/Decl.ts"
import type { Schema } from "../../schema/index.ts"
import { render, renderUniqueHelpers, type SwiftRendererOptions } from "./render.ts"

const debug = Debug("tsondb:renderer:swift")

const extension = ".swift"

export const SwiftOutput = (options: {
  targetPath: string
  rendererOptions?: Partial<SwiftRendererOptions>
}): Output => ({
  run: async <T extends DefaultTSONDBTypes>(schema: Schema<T>): Promise<void> => {
    if (options.rendererOptions?.preserveFiles === true) {
      debug("emitting declarations to multiple files...")
      await rm(options.targetPath, { recursive: true, force: true })
      await mkdir(options.targetPath, { recursive: true })
      const declarationsBySourceUrl = groupDeclarationsBySourceUrl(schema.declarations)
      const sourceRootPath = fileURLToPath(commonPrefix(...Object.keys(declarationsBySourceUrl)))
      debug("common source root path: %s", sourceRootPath)
      if (sourceRootPath) {
        const uniqueHelpersFileName = "TSONDB+Helpers.swift"
        await writeFile(
          join(options.targetPath, uniqueHelpersFileName),
          renderUniqueHelpers(uniqueHelpersFileName, options.rendererOptions, schema),
          {
            encoding: "utf-8",
          },
        )
        await Promise.all(
          Object.entries(declarationsBySourceUrl).map(async ([sourceUrl, decls]) => {
            const sourcePath = fileURLToPath(sourceUrl)
            const relativePath = dirname(relative(sourceRootPath, sourcePath))
            const newDir = join(options.targetPath, relativePath)
            const newFileName = basename(sourcePath, extname(sourcePath)) + extension
            const newPath = join(newDir, newFileName)
            await mkdir(newDir, { recursive: true })
            await writeFile(
              newPath,
              render(newFileName, options.rendererOptions, decls ?? [], schema, false),
              {
                encoding: "utf-8",
              },
            )
          }),
        )
        debug("emitted declaration files to %s", options.targetPath)
      }
    } else {
      debug("emitting declarations to single file...")
      const safePath = options.targetPath.endsWith(extension)
        ? options.targetPath
        : options.targetPath + extension
      await mkdir(dirname(safePath), { recursive: true })
      await writeFile(
        safePath,
        render(basename(safePath), options.rendererOptions, schema.declarations, schema, true),
        {
          encoding: "utf-8",
        },
      )
      debug("emitted declarations to %s", options.targetPath)
    }
  },
})
