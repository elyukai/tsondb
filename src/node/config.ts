import type { Output } from "../shared/output.ts"
import type { EntityDecl } from "./schema/index.ts"
import type { Schema } from "./schema/Schema.ts"

export type Config = {
  serverOptions?: ServerOptions
  schema: Schema
  outputs: Output[]
  defaultLocales: string[]
  dataRootPath: string
  homeLayoutSections?: HomeLayoutSection[]
}

export type ServerOptions = {
  port: number
}

export type HomeLayoutSection = {
  title: string
  comment?: string
  entities: EntityDecl[]
}

export const validateConfig = (config: Config): void => {
  if (config.defaultLocales.length === 0) {
    throw new Error("At least one default locale must be specified in the config.")
  }
}
