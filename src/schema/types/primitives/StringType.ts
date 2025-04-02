import { PrimitiveType } from "./PrimitiveType.js"

export class StringType extends PrimitiveType {
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  isMarkdown?: boolean

  constructor(
    options: {
      minLength?: number
      maxLength?: number
      pattern?: RegExp
      isMarkdown?: boolean
    } = {},
  ) {
    super()
    this.minLength = options.minLength
    this.maxLength = options.maxLength
    this.pattern = options.pattern
    this.isMarkdown = options.isMarkdown
  }

  validate(value: unknown): void {
    if (typeof value !== "string") {
      throw new TypeError(`Expected a string, but got ${JSON.stringify(value)}`)
    }
  }
}

export const String = (...args: ConstructorParameters<typeof StringType>) => {
  return new StringType(...args)
}
