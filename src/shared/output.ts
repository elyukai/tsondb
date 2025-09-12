import type { Schema } from "../node/schema/Schema.ts"

export interface Output {
  run: (schema: Schema) => Promise<void>
}
