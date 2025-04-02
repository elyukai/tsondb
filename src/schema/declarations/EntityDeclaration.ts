import { TypeParameter } from "../parameters/TypeParameter.js"
import { ObjectType } from "../types/generic/ObjectType.js"
import { Declaration, TypeArguments } from "./Declaration.js"

export class EntityDeclaration<
  Name extends string,
  T extends ObjectType<any>,
  PK extends keyof T["properties"],
  Params extends TypeParameter[] = [],
> extends Declaration<Name, Params> {
  type: (...args: Params) => T
  primaryKey: PK[]

  constructor(
    sourceUrl: string,
    options: {
      name: Name
      comment?: string
      parameters: Params
      type: (...args: Params) => T
      primaryKey: PK | PK[]
    },
  ) {
    super(sourceUrl, options)
    this.type = options.type
    this.primaryKey = Array.isArray(options.primaryKey) ? options.primaryKey : [options.primaryKey]
  }

  getNestedDeclarations(): Declaration[] {
    return this.type(...this.parameters).getNestedDeclarations()
  }

  validate(value: unknown, args: TypeArguments<Params>): void {
    this.type(...this.parameters)
      .replaceTypeArguments(this.getTypeArgumentsRecord(args))
      .validate(value)
  }
}

export const Entity = <
  Name extends string,
  T extends ObjectType<any>,
  PK extends keyof T["properties"],
>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    type: () => T
    primaryKey: PK | PK[]
  },
) => {
  return new EntityDeclaration(sourceUrl, {
    ...options,
    parameters: [],
  })
}

export const GenEntity = <
  Name extends string,
  T extends ObjectType<any>,
  PK extends keyof T["properties"],
  Params extends TypeParameter[] = [],
>(
  ...args: ConstructorParameters<typeof EntityDeclaration<Name, T, PK, Params>>
) => {
  return new EntityDeclaration(...args)
}
