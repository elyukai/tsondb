import { TypeParameter } from "../parameters/TypeParameter.js"
import { Declaration, TypeArguments } from "./Declaration.js"

export class EnumDeclaration<
  Name extends string,
  Params extends TypeParameter[] = [],
> extends Declaration<Name, Params> {
  values: string[]

  constructor(
    sourceUrl: string,
    options: {
      name: Name
      comment?: string
      parameters: Params
      type: (...args: Params) => string[]
    },
  ) {
    super(sourceUrl, options)
    this.values = options.type(...options.parameters)
  }

  getNestedDeclarations(): Declaration[] {
    return []
  }

  validate(value: unknown, args: TypeArguments<Params>): void {}
}
