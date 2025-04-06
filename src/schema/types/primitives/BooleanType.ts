import { Node, NodeKind } from "../../Node.js"
import { BaseType } from "../Type.js"

export interface BooleanType extends BaseType {
  kind: typeof NodeKind.BooleanType
}

export const Boolean = (): BooleanType => ({
  kind: NodeKind.BooleanType,
})

export const isBooleanType = (node: Node): node is BooleanType => node.kind === NodeKind.BooleanType

export const validateBooleanType = (_typeDefinition: BooleanType, value: unknown): void => {
  if (typeof value !== "boolean") {
    throw new TypeError(`Expected a boolean value, but got ${JSON.stringify(value)}`)
  }
}
