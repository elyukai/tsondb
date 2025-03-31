import { ObjectType } from "../types/generic/ObjectType.js"
import { Type } from "../types/Type.js"
import { Declaration } from "./Declaration.js"

export class TypeAliasDeclaration<Name extends string, T extends Type> extends Declaration {
  name: Name
  comment?: string
  type: T

  constructor(sourceUrl: string, options: { name: Name; comment?: string; type: T }) {
    super(sourceUrl)
    this.name = options.name
    this.comment = options.comment
    this.type = options.type
  }

  getNestedDeclarations(): Declaration[] {
    return []
  }
}

export const TypeAlias = <Name extends string, T extends ObjectType<any>>(
  ...args: ConstructorParameters<typeof TypeAliasDeclaration<Name, T>>
) => {
  return new TypeAliasDeclaration(...args)
}
