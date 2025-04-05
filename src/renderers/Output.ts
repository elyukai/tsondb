import { Schema } from "../Schema.js"

export interface Output {
  run: (schema: Schema) => Promise<void>
}
