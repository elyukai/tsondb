import { TypeAliasDeclaration } from "../../declarations/TypeAliasDeclaration.js"
import { ObjectType } from "../generic/ObjectType.js"
import { Type } from "../Type.js"

export class ReferenceType<T extends TypeAliasDeclaration<string, ObjectType<any>>> extends Type {
  reference: T

  constructor(reference: T) {
    super()
    this.reference = reference
  }
}

export const Reference = <T extends TypeAliasDeclaration<string, ObjectType<any>>>(
  ...args: ConstructorParameters<typeof ReferenceType<T>>
) => {
  return new ReferenceType(...args)
}
