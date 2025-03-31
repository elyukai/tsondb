import { PrimitiveType } from "./PrimitiveType.js"

export class StringType extends PrimitiveType {
  minLength?: number
  maxLength?: number
  pattern?: RegExp

  constructor(
    options: {
      minLength?: number
      maxLength?: number
      pattern?: RegExp
    } = {},
  ) {
    super()
    this.minLength = options.minLength
    this.maxLength = options.maxLength
    this.pattern = options.pattern
  }
}

export const String = (...args: ConstructorParameters<typeof StringType>) => {
  return new StringType(...args)
}
