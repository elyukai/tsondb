import type { DefaultTSONDBTypes } from "../node/index.ts"
import type { Schema } from "../node/schema/Schema.ts"

export interface Output {
  run: <T extends DefaultTSONDBTypes>(schema: Schema<T>) => Promise<void>
}
