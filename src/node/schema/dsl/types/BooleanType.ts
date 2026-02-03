import { NodeKind } from "../../../../shared/schema/Node.ts"
import type { Node } from "../index.ts"
import type { BaseType } from "./Type.ts"

export interface BooleanType extends BaseType {
  kind: NodeKind["BooleanType"]
}

export const BooleanType = (): BooleanType => ({
  kind: NodeKind.BooleanType,
})

export { BooleanType as Boolean }

export const isBooleanType = (node: Node): node is BooleanType => node.kind === NodeKind.BooleanType
