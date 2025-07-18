import type { Schema } from "../Schema.ts"

export interface Output {
  run: (schema: Schema) => Promise<void>
}
