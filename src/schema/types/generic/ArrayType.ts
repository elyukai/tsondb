import { validateOption } from "../../validation/options.js"
import { Type } from "../Type.js"

export class ArrayType<T extends Type> extends Type {
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  items: T

  constructor(
    items: T,
    options: {
      minItems?: number
      maxItems?: number
      uniqueItems?: boolean
    },
  ) {
    super()
    this.minItems = validateOption(
      options.minItems,
      "minItems",
      option => Number.isInteger(option) && option >= 0,
    )
    this.maxItems = validateOption(
      options.maxItems,
      "maxItems",
      option => Number.isInteger(option) && option >= 0,
    )
    this.uniqueItems = options.uniqueItems
    this.items = items
  }

  validate(value: unknown): void {
    if (!Array.isArray(value)) {
      throw new TypeError(`Expected an array, but got ${JSON.stringify(value)}`)
    }

    if (this.minItems !== undefined && value.length < this.minItems) {
      throw new RangeError(
        `Expected at least ${this.minItems} item${this.minItems === 1 ? "" : "s"}, but got ${
          value.length
        } item${value.length === 1 ? "" : "s"}`,
      )
    }

    if (this.maxItems !== undefined && value.length > this.maxItems) {
      throw new RangeError(
        `Expected at most ${this.maxItems} item${this.maxItems === 1 ? "" : "s"}, but got ${
          value.length
        } item${value.length === 1 ? "" : "s"}`,
      )
    }

    if (this.uniqueItems) {
      // if (typeof this.uniqueItems === "function") {
      //   const seen = new Set<any>()
      //   for (const item of value) {
      //     for (const other of seen) {
      //       if (this.uniqueItems(item, other)) {
      //         throw new TypeError(`Duplicate item found: ${JSON.stringify(item)}`)
      //       }
      //     }
      //     seen.add(item)
      //   }
      // } else {
      const seen = new Set()
      for (const item of value) {
        if (seen.has(item)) {
          throw new TypeError(`Duplicate item found: ${JSON.stringify(item)}`)
        }
        seen.add(item)
      }
      // }
    }

    value.forEach((item, index) => {
      try {
        this.items.validate(item)
      } catch (error) {
        throw new Error(`at index ${index}`, { cause: error })
      }
    })
  }

  replaceTypeArguments(args: Record<string, Type>): ArrayType<Type> {
    return new ArrayType(this.items.replaceTypeArguments(args), {
      ...this,
    })
  }
}

const _Array = <T extends Type>(...args: ConstructorParameters<typeof ArrayType<T>>) => {
  return new ArrayType(...args)
}

export { _Array as Array }
