import { TypeParameter } from "../parameters/TypeParameter.js"
import { ObjectType } from "../types/generic/ObjectType.js"
import { ReferenceType } from "../types/references/ReferenceType.js"
import { Type } from "../types/Type.js"
import { Declaration, TypeArguments } from "./Declaration.js"

export class TypeAliasDeclaration<
  Name extends string,
  T extends Type,
  Params extends TypeParameter[] = [],
> extends Declaration<Name, Params> {
  type: (...args: Params) => T

  constructor(
    sourceUrl: string,
    options: { name: Name; comment?: string; parameters: Params; type: (...args: Params) => T },
  ) {
    super(sourceUrl, options)
    this.name = options.name
    this.type = options.type
  }

  getNestedDeclarations(): Declaration[] {
    const type = this.type(...this.parameters)
    if (type instanceof ObjectType) {
      return type.getNestedDeclarations()
    } else if (type instanceof ReferenceType) {
      return type.reference.getNestedDeclarations()
    } else {
      return []
    }
  }

  validate(value: unknown, args: TypeArguments<Params>): void {
    this.type(...this.parameters)
      .replaceTypeArguments(this.getTypeArgumentsRecord(args))
      .validate(value)
  }
}

export const TypeAlias = <Name extends string, T extends ObjectType<any>>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    type: T
  },
) => {
  return new TypeAliasDeclaration(sourceUrl, {
    ...options,
    parameters: [],
    type: () => options.type,
  })
}

export const GenTypeAlias = <
  Name extends string,
  T extends ObjectType<any>,
  Params extends TypeParameter[] = [],
>(
  ...args: ConstructorParameters<typeof TypeAliasDeclaration<Name, T, Params>>
) => {
  return new TypeAliasDeclaration(...args)
}
