import { EntityDeclaration } from "../../declarations/EntityDeclaration.js"
import { ObjectType } from "../generic/ObjectType.js"
import { Type } from "../Type.js"

export class ForeignKeyType<
  T extends EntityDeclaration<string, ObjectType<any>, string>,
> extends Type {
  entity: T

  constructor(entity: T) {
    super()
    this.entity = entity
  }
}

export const ForeignKey = <T extends EntityDeclaration<string, ObjectType<any>, string>>(
  ...args: ConstructorParameters<typeof ForeignKeyType<T>>
) => {
  return new ForeignKeyType(...args)
}
