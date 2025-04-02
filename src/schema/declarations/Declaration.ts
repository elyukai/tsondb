import { TypeParameter } from "../parameters/TypeParameter.js"
import { Type } from "../types/Type.js"

export abstract class Declaration<
  Name extends string = string,
  Params extends TypeParameter[] = any,
> {
  sourceUrl: string
  name: Name
  comment?: string
  parameters: Params

  constructor(
    sourceUrl: string,
    options: {
      name: Name
      comment?: string
      parameters: Params
    },
  ) {
    this.sourceUrl = sourceUrl
    this.name = options.name
    this.comment = options.comment
    this.parameters = options.parameters
  }

  getParameterNames(): string[] {
    return this.parameters.map(param => param.name)
  }

  protected getTypeArgumentsRecord(args: TypeArguments<Params>): Record<string, Type> {
    return Object.fromEntries(args.map((arg, i) => [this.parameters[i]!.name, arg] as const))
  }

  abstract validate(value: unknown, args: TypeArguments<Params>): void

  abstract getNestedDeclarations(): Declaration[]
}

export type TypeArguments<Params extends TypeParameter[]> = {
  [K in keyof Params]: Params[K] extends TypeParameter<string, infer T> ? T : Type
}
