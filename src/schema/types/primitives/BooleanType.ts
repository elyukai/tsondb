import { Node, NodeKind } from "../../Node.js"
import { Validator } from "../../validation/type.js"
import { BaseType } from "../Type.js"

export interface BooleanType extends BaseType {
  kind: typeof NodeKind.BooleanType
}

export const Boolean = (): BooleanType => ({
  kind: NodeKind.BooleanType,
})

export const isBooleanType = (node: Node): node is BooleanType => node.kind === NodeKind.BooleanType

export const validateBooleanType: Validator<BooleanType> = (_helpers, _type, value) => {
  if (typeof value !== "boolean") {
    return [TypeError(`Expected a boolean value, but got ${JSON.stringify(value)}`)]
  }

  return []
}
