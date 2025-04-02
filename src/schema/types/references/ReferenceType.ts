import { TypeArguments } from "../../declarations/Declaration.js"
import { TypeAliasDeclaration } from "../../declarations/TypeAliasDeclaration.js"
import { TypeParameter } from "../../parameters/TypeParameter.js"
import { ObjectType } from "../generic/ObjectType.js"
import { Type } from "../Type.js"

export class ReferenceType<
  T extends TypeAliasDeclaration<string, ObjectType<any>, Params>,
  Params extends TypeParameter[] = [],
> extends Type {
  reference: T
  args: TypeArguments<Params>

  constructor(reference: T, args: TypeArguments<Params>) {
    super()
    this.reference = reference
    this.args = args
  }

  validate(value: unknown): void {
    this.reference.validate(value, this.args)
  }

  replaceTypeArguments(args: Record<string, Type>): Type {
    return new ReferenceType(
      this.reference as unknown as TypeAliasDeclaration<string, ObjectType<any>, TypeParameter[]>,
      this.args.map(arg => arg.replaceTypeArguments(args)),
    )
  }
}

export const Reference = <
  T extends TypeAliasDeclaration<string, ObjectType<any>, Params>,
  Params extends TypeParameter[] = [],
>(
  ...args: ConstructorParameters<typeof ReferenceType<T, Params>>
) => {
  return new ReferenceType(...args)
}
