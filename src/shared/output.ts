import type { DefaultTSONDBTypes } from "../node/index.ts"
import type { Schema } from "../node/schema/index.ts"

export interface Output {
  run: <T extends DefaultTSONDBTypes>(schema: Schema<T>) => Promise<void>
}
