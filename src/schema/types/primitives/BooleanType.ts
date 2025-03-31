import { PrimitiveType } from "./PrimitiveType.js"

export class BooleanType extends PrimitiveType {
  constructor() {
    super()
  }
}

export const Boolean = (...args: ConstructorParameters<typeof BooleanType>) => {
  return new BooleanType(...args)
}
