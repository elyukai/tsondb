import { EntityDeclaration } from "../../declarations/EntityDeclaration.js"
import { ObjectType } from "../generic/ObjectType.js"
import { Type } from "../Type.js"

export class ForeignKeyType<
  T extends EntityDeclaration<string, ObjectType<any>, string, any>,
> extends Type {
  entity: T

  constructor(entity: T) {
    super()
    this.entity = entity
  }

  validate(_value: unknown): void {}

  replaceTypeArguments(): this {
    return this
  }
}

export const ForeignKey = <T extends EntityDeclaration<string, ObjectType<any>, string, any>>(
  ...args: ConstructorParameters<typeof ForeignKeyType<T>>
) => {
  return new ForeignKeyType(...args)
}
