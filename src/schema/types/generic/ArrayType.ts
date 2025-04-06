import { Decl, getNestedDeclarations } from "../../declarations/Declaration.js"
import { Node, NodeKind } from "../../Node.js"
import { validateOption } from "../../validation/options.js"
import { parallelizeErrors, validateLengthRangeBound, Validator } from "../../validation/type.js"
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

export const validateArrayType: Validator<ArrayType> = (helpers, type, value) => {
  if (!Array.isArray(value)) {
    return [TypeError(`Expected an array, but got ${JSON.stringify(value)}`)]
  }

  return parallelizeErrors([
    validateLengthRangeBound("lower", "item", type.minItems, value),
    validateLengthRangeBound("upper", "item", type.maxItems, value),
    type.uniqueItems
      ? (() => {
          // if (typeof this.uniqueItems === "function") {
          //   const seen = new Set<any>()
          //   for (const item of value) {
          //     for (const other of seen) {
          //       if (this.uniqueItems(item, other)) {
          //         return TypeError(`Duplicate item found: ${JSON.stringify(item)}`)
          //       }
          //     }
          //     seen.add(item)
          //   }
          // } else {
          const seen = new Set()
          for (const item of value) {
            if (seen.has(item)) {
              return TypeError(`Duplicate item found: ${JSON.stringify(item)}`)
            }
            seen.add(item)
          }
          return undefined
          // }
        })()
      : undefined,
  ]).concat(
    value.flatMap((item, index) =>
      validate(helpers, type.items, item).map(err =>
        TypeError(`at index ${index}`, { cause: err }),
      ),
    ),
  )
}

export const replaceTypeArgumentsInArrayType = (
  args: Record<string, Type>,
  type: ArrayType,
): ArrayType =>
  _Array(replaceTypeArguments(args, type.items), {
    ...type,
  })
