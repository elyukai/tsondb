import { ObjectType } from "../types/generic/ObjectType.js"
import { Declaration } from "./Declaration.js"

export class EntityDeclaration<
  Name extends string,
  T extends ObjectType<any>,
  PK extends keyof T["properties"],
> extends Declaration {
  name: Name
  comment?: string
  type: T
  primaryKey: PK[]

  constructor(
    sourceUrl: string,
    options: { name: Name; comment?: string; type: T; primaryKey: PK | PK[] },
  ) {
    super(sourceUrl)
    this.name = options.name
    this.comment = options.comment
    this.type = options.type
    this.primaryKey = Array.isArray(options.primaryKey) ? options.primaryKey : [options.primaryKey]
  }

  getNestedDeclarations(): Declaration[] {
    return this.type.getNestedDeclarations()
  }
}

export const Entity = <
  Name extends string,
  T extends ObjectType<any>,
  PK extends keyof T["properties"],
>(
  ...args: ConstructorParameters<typeof EntityDeclaration<Name, T, PK>>
) => {
  return new EntityDeclaration(...args)
}
