import { validateOption } from "../../validation/options.js"
import { NumericType, RangeBound } from "./NumericType.js"

const isIntegerRangeBoundOption = (option: RangeBound) =>
  Number.isInteger(typeof option === "number" ? option : option.value)

export class IntegerType extends NumericType {
  constructor(
    options: {
      minimum?: RangeBound
      maximum?: RangeBound
      multipleOf?: number
    } = {},
  ) {
    super()
    this.minimum = validateOption(options.minimum, "minimum", isIntegerRangeBoundOption)
    this.maximum = validateOption(options.maximum, "maximum", isIntegerRangeBoundOption)
    this.multipleOf = options.multipleOf
  }

  validate(value: unknown): void {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw new TypeError(`Expected an integer, but got ${JSON.stringify(value)}`)
    }
  }
}

export const Integer = (...args: ConstructorParameters<typeof IntegerType>) => {
  return new IntegerType(...args)
}
