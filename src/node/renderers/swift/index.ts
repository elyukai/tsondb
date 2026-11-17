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
        await writeFile(
          join(options.targetPath, "TSONDB+Helpers.swift"),
          renderUniqueHelpers(options.rendererOptions, schema.entities, schema.singletonEntities),
          {
            encoding: "utf-8",
          },
        )
        await Promise.all(
          Object.entries(declarationsBySourceUrl).map(async ([sourceUrl, decls]) => {
            const sourcePath = fileURLToPath(sourceUrl)
            const relativePath = dirname(relative(sourceRootPath, sourcePath))
            const newDir = join(options.targetPath, relativePath)
            const newPath = join(newDir, basename(sourcePath, extname(sourcePath)) + extension)
            await mkdir(newDir, { recursive: true })
            await writeFile(
              newPath,
              render(
                options.rendererOptions,
                decls ?? [],
                schema.entities,
                schema.singletonEntities,
                false,
              ),
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
        render(
          options.rendererOptions,
          schema.declarations,
          schema.entities,
          schema.singletonEntities,
          true,
        ),
        {
          encoding: "utf-8",
        },
      )
      debug("emitted declarations to %s", options.targetPath)
    }
  },
})
