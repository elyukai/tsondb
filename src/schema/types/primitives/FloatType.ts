import { NumericType, RangeBound } from "./NumericType.js"

export class FloatType extends NumericType {
  constructor(
    options: {
      minimum?: RangeBound
      maximum?: RangeBound
      multipleOf?: number
    } = {},
  ) {
    super()
    this.minimum = options.minimum
    this.maximum = options.maximum
    this.multipleOf = options.multipleOf
  }

  validate(value: unknown): void {
    if (typeof value !== "number") {
      throw new TypeError(`Expected a floating-point number, but got ${JSON.stringify(value)}`)
    }
  }
}

export const Float = (...args: ConstructorParameters<typeof FloatType>) => {
  return new FloatType(...args)
}
