import { Type } from "../Type.js"

export abstract class PrimitiveType extends Type {
  replaceTypeArguments(): this {
    return this
  }
}
