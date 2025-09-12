import type { Schema } from "../node/schema/Schema.ts"
import type { Output } from "./output.ts"

export type Config = {
  serverOptions?: ServerOptions
  schema: Schema
  outputs: Output[]
  dataRootPath: string
}

export type ServerOptions = {
  port: number
}
