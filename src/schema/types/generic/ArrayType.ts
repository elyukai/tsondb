import { validateOption } from "../../validation/options.js"
import { Type } from "../Type.js"

export class ArrayType<T extends Type> extends Type {
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean | ((a: T, b: T) => boolean)
  items: T

  constructor(
    items: T,
    options: {
      minItems?: number
      maxItems?: number
      uniqueItems?: boolean | ((a: T, b: T) => boolean)
    },
  ) {
    super()
    this.minItems = validateOption(
      options.minItems,
      "minItems",
      (option) => Number.isInteger(option) && option >= 0,
    )
    this.maxItems = validateOption(
      options.maxItems,
      "maxItems",
      (option) => Number.isInteger(option) && option >= 0,
    )
    this.uniqueItems = options.uniqueItems
    this.items = items
  }
}

export const Array = <T extends Type>(...args: ConstructorParameters<typeof ArrayType<T>>) => {
  return new ArrayType(...args)
}
