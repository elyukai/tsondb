import { Type } from "../types/Type.js"

export class TypeParameter<N extends string = string, T extends Type = Type> {
  name: N
  constraint?: T

  constructor(name: N, constraint?: T) {
    this.name = name
    this.constraint = constraint
  }
}

export const Param = <N extends string = string, T extends Type = Type>(
  ...args: ConstructorParameters<typeof TypeParameter<N, T>>
) => {
  return new TypeParameter(...args)
}
