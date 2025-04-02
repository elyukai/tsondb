import { TypeParameter } from "../../parameters/TypeParameter.js"
import { Type } from "../Type.js"

export class ArgumentType<T extends TypeParameter> extends Type {
  argument: T

  constructor(argument: T) {
    super()
    this.argument = argument
  }

  validate(_value: unknown): void {}

  replaceTypeArguments(args: Record<string, Type>): Type {
    return args[this.argument.name]!
  }
}

export const Argument = <T extends TypeParameter>(
  ...args: ConstructorParameters<typeof ArgumentType<T>>
) => {
  return new ArgumentType(...args)
}
