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
}

export const Float = (...args: ConstructorParameters<typeof FloatType>) => {
  return new FloatType(...args)
}
