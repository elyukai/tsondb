import type { DefaultTSONDBTypes } from "./index.ts"
import type { Schema } from "./schema/index.ts"

export interface Output {
  run: <T extends DefaultTSONDBTypes>(schema: Schema<T>) => Promise<void>
}
