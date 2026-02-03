import { NodeKind } from "../../../../shared/schema/Node.ts"
import { validateOption } from "../../validation/options.ts"
import type { Node } from "../index.ts"
import type { BaseType, Type } from "./Type.ts"

export interface ArrayType<T extends Type = Type> extends BaseType {
  kind: NodeKind["ArrayType"]
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  items: T
}

export const ArrayType = <T extends Type>(
  items: T,
  options: {
    minItems?: number
    maxItems?: number
    uniqueItems?: boolean
  } = {},
): ArrayType<T> => ({
  ...options,
  kind: NodeKind.ArrayType,
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
})

export { ArrayType as Array }

export const isArrayType = (node: Node): node is ArrayType => node.kind === NodeKind.ArrayType
