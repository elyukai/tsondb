import type { Validators } from "../Node.ts"
import type { Type } from "../types/Type.ts"

export type ValidatorHelpers = Validators

export type Validator<T extends Type, Args extends unknown[] = []> = (
  helpers: ValidatorHelpers,
  type: T,
  value: unknown,
  ...args: Args
) => Error[]
