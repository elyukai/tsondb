import type { Validators } from "../Node.js"
import type { Type } from "../types/Type.js"

export type ValidatorHelpers = Validators

export type Validator<T extends Type, Args extends unknown[] = []> = (
  helpers: ValidatorHelpers,
  type: T,
  value: unknown,
  ...args: Args
) => Error[]
