import type { Output } from "../shared/output.ts"
import type { DefaultTSONDBTypes, ValidationOptions } from "./index.ts"
import type { EntityDecl } from "./schema/dsl/index.ts"
import type { Schema } from "./schema/index.ts"

/**
 * The main configuration type for TSONDB.
 */
export type Config<T extends DefaultTSONDBTypes = DefaultTSONDBTypes> = {
  serverOptions?: ServerOptions
  schema: Schema<T>
  outputs?: Output[]

  /**
   * Default locales for the server/editor and locales used for testing via CLI.
   */
  locales?: string[]
  dataRootPath?: string
  homeLayoutSections?: HomeLayoutSection[]
  customStylesheetPath?: string
  validationOptions?: Partial<ValidationOptions>
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
export type DataConfig = Config & {
  schema: Schema
  dataRootPath: string
}

export const validateConfigForData: (config: Config) => asserts config is DataConfig = config => {
  if (config.dataRootPath === undefined) {
    throw new Error("A data root path must be specified in the config.")
  }
}

/**
 * The configuration type required for running the server for the editor.
 */
export type ServerConfig = DataConfig & {
  serverOptions?: ServerOptions
  locales: string[]
  homeLayoutSections?: HomeLayoutSection[]
  validationOptions?: Partial<ValidationOptions>
  customStylesheetPath?: string
}

/**
 * The configuration type required for validating the contents of the database.
 */
export type TestingConfig = DataConfig & {
  locales: string[]
  validationOptions?: Partial<ValidationOptions>
}

/**
 * The configuration type required for formatting the contents of the database.
 */
export type FormattingConfig = DataConfig

export const validateConfigForServer: (
  config: Config,
) => asserts config is ServerConfig = config => {
  if ((config.locales?.length ?? 0) === 0) {
    throw new Error("At least one locale must be specified in the config.")
  }

  if (config.dataRootPath === undefined) {
    throw new Error("A data root path must be specified in the config.")
  }
}

export const validateConfigForTesting: (
  config: Config,
) => asserts config is TestingConfig = config => {
  if ((config.locales?.length ?? 0) === 0) {
    throw new Error("At least one locale must be specified in the config.")
  }

  if (config.dataRootPath === undefined) {
    throw new Error("A data root path must be specified in the config.")
  }
}

export const validateConfigForFormatting: (
  config: Config,
) => asserts config is FormattingConfig = config => {
  if (config.dataRootPath === undefined) {
    throw new Error("A data root path must be specified in the config.")
  }
}
