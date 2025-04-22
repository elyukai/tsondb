import { Validators } from "../Node.js"
import { Type } from "../types/Type.js"

export type ValidatorHelpers = Validators

export type Validator<T extends Type, Args extends any[] = []> = (
  helpers: ValidatorHelpers,
  type: T,
  value: unknown,
  ...args: Args
) => Error[]
