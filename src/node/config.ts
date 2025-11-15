import type { Output } from "../shared/output.ts"
import type { EntityDecl } from "./schema/index.ts"
import type { Schema } from "./schema/Schema.ts"

/**
 * The main configuration type for TSONDB.
 */
export type Config = {
  serverOptions?: ServerOptions
  schema: Schema
  outputs?: Output[]
  defaultLocales?: string[]
  dataRootPath?: string
  homeLayoutSections?: HomeLayoutSection[]
  customStylesheetPath?: string
}

export type ServerOptions = {
  port: number
}

export type HomeLayoutSection = {
  title: string
  comment?: string
  entities: EntityDecl[]
}

/**
 * The configuration type required for generation commands.
 */
export type GenerationConfig = { schema: Schema; outputs: Output[] }

export const validateConfigForGeneration: (
  config: Config,
) => asserts config is GenerationConfig = config => {
  if ((config.outputs?.length ?? 0) === 0) {
    throw new Error("At least one output must be specified in the config.")
  }
}

/**
 * The configuration type required for any commands that need to read data stored in the database.
 */
export type DataConfig = {
  schema: Schema
  dataRootPath: string
}

/**
 * The configuration type required for running the server for the editor.
 */
export type ServerConfig = DataConfig & {
  serverOptions?: ServerOptions
  defaultLocales: string[]
  homeLayoutSections?: HomeLayoutSection[]
  customStylesheetPath?: string
}

export const validateConfigForServer: (
  config: Config,
) => asserts config is ServerConfig = config => {
  if ((config.defaultLocales?.length ?? 0) === 0) {
    throw new Error("At least one default locale must be specified in the config.")
  }

  if (config.dataRootPath === undefined) {
    throw new Error("A data root path must be specified in the config.")
  }
}

export const validateConfigForTesting: (
  config: Config,
) => asserts config is DataConfig = config => {
  if (config.dataRootPath === undefined) {
    throw new Error("A data root path must be specified in the config.")
  }
}

export const validateConfigForFormatting: (
  config: Config,
) => asserts config is DataConfig = config => {
  if (config.dataRootPath === undefined) {
    throw new Error("A data root path must be specified in the config.")
  }
}
