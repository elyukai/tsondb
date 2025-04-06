import { Decl, getNestedDeclarations } from "../../declarations/Declaration.js"
import { Node, NodeKind } from "../../Node.js"
import { validateOption } from "../../validation/options.js"
import { BaseType, replaceTypeArguments, Type, validate } from "../Type.js"

type TConstraint = Type

export interface ArrayType<T extends TConstraint = TConstraint> extends BaseType {
  kind: typeof NodeKind.ArrayType
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  items: T
}

const _Array = {
  Array: <T extends TConstraint>(
    items: T,
    options: {
      minItems?: number
      maxItems?: number
      uniqueItems?: boolean
    } = {},
  ): ArrayType<T> => {
    const type: ArrayType<T> = {
      kind: NodeKind.ArrayType,
      ...options,
      minItems: validateOption(
        options.minItems,
        "minItems",
        option => Number.isInteger(option) && option >= 0,
      ),
      maxItems: validateOption(
        options.maxItems,
        "maxItems",
        option => Number.isInteger(option) && option >= 0,
      ),
      items,
    }

    items.parent = type

    return type
  },
}.Array

export { _Array as Array }

export const isArrayType = (node: Node): node is ArrayType => node.kind === NodeKind.ArrayType

export const getNestedDeclarationsInArrayType = (type: ArrayType): Decl[] =>
  getNestedDeclarations(type.items)

export const validateArrayType = (type: ArrayType, value: unknown): void => {
  if (!Array.isArray(value)) {
    throw new TypeError(`Expected an array, but got ${JSON.stringify(value)}`)
  }

  if (type.minItems !== undefined && value.length < type.minItems) {
    throw new RangeError(
      `Expected at least ${type.minItems} item${type.minItems === 1 ? "" : "s"}, but got ${
        value.length
      } item${value.length === 1 ? "" : "s"}`,
    )
  }

  if (type.maxItems !== undefined && value.length > type.maxItems) {
    throw new RangeError(
      `Expected at most ${type.maxItems} item${type.maxItems === 1 ? "" : "s"}, but got ${
        value.length
      } item${value.length === 1 ? "" : "s"}`,
    )
  }

  if (type.uniqueItems) {
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
      validate(type.items, item)
    } catch (error) {
      throw new Error(`at index ${index}`, { cause: error })
    }
  })
}

export const replaceTypeArgumentsInArrayType = (
  args: Record<string, Type>,
  type: ArrayType,
): ArrayType =>
  _Array(replaceTypeArguments(args, type.items), {
    ...type,
  })
