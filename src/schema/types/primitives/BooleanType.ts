import { PrimitiveType } from "./PrimitiveType.js"

export class BooleanType extends PrimitiveType {
  constructor() {
    super()
  }

  validate(value: unknown): void {
    if (typeof value !== "boolean") {
      throw new TypeError(`Expected a boolean value, but got ${JSON.stringify(value)}`)
    }
  }
}

export const Boolean = (...args: ConstructorParameters<typeof BooleanType>) => {
  return new BooleanType(...args)
}
