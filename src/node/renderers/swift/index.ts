import Debug from "debug"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { basename, dirname, extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { commonPrefix } from "../../../shared/utils/string.ts"
import type { Schema } from "../../Schema.ts"
import { groupDeclarationsBySourceUrl } from "../../schema/declarations/Declaration.ts"
import type { Output } from "../Output.ts"
import { renderAstRoot } from "./renderer.ts"
import { transformAst } from "./transform.ts"

const debug = Debug("tsondb:renderer:swift")

const extension = ".swift"

const createTransformer = (options: SwiftOptions): AstTransformer => {
  const transformer: AstTransformer = (ast, meta) => {
    const main = ast.jsDoc?.tags.main

    const swiftAst = transformAst(ast, options, main)

    if (swiftAst === undefined) {
      return undefined
    }

    return renderAstRoot(swiftAst, meta, options)
  }

  return transformer
}

export const SwiftOutput = (options: {
  targetPath: string
  rendererOptions: SwiftOptions
}): Output => ({
  run: async (schema: Schema): Promise<void> => {
    if (options.rendererOptions.preserveFiles) {
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

export type SwiftOptions = {
  indentation?: number

  preserveFiles?: boolean

  /**
   * The package name to use in all file comments.
   */
  packageName: string

  // /**
  //  *
  //  * @param ast The AST to modify.
  //  * @returns A new AST.
  //  */
  // modifyAst?: (ast: AstRoot) => AstRoot

  /**
   * If `struct` members are always generated as `let`. This ignores the `isReadOnly` AST flag.
   */
  forceConstantStructMembers?: boolean

  /**
   * If generated types and members should be `public`.
   */
  defaultPublic?: boolean

  /**
   * If generated type and member names’ casing should be converted to Swift conventions.
   */
  convertIdentifiersToNamingConvention?: boolean

  /**
   * If generated `struct` types should have initializers generated. Initializers will have default `nil` values for optional members.
   */
  generateStructInitializers?: boolean

  /**
   * If generated `struct` types should have `Decodable` conformances.
   */
  decodableSynthesization?: {
    /**
     * For enumerations with associated values, the key of the discriminator property.
     */
    discriminatorKey: string
  }

  /**
   * Conformances to add to generated types.
   */
  addConformances?: {
    /**
     * The identifier of the type to add.
     */
    identifier:
      | string
      | ((node: RecordNode | UnionNode | EnumerationNode | TypeParameterNode) => string)

    /**
     * If the type includes `Decodable` conformance, which will not add an additional `Decodable` conformance if `decodableSynthesization` is used.
     */
    includesDecodable?: boolean

    /**
     * If set, whether the type is only for main types (`true`) or sub types (`false`).
     */
    forMainTypes?: boolean
  }[]
}
