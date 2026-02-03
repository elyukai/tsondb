import { NodeKind } from "../../../../shared/schema/Node.js"
import type { Node } from "../index.ts"
import type { TypeParameter } from "../TypeParameter.ts"
import type { BaseType } from "./Type.ts"

type TConstraint = TypeParameter

export interface TypeArgumentType<T extends TConstraint = TConstraint> extends BaseType {
  kind: NodeKind["TypeArgumentType"]
  argument: T
}

export const TypeArgumentType = <T extends TConstraint>(argument: T): TypeArgumentType<T> => ({
  kind: NodeKind.TypeArgumentType,
  argument,
})

export { TypeArgumentType as TypeArgument }

export const isTypeArgumentType = (node: Node): node is TypeArgumentType =>
  node.kind === NodeKind.TypeArgumentType
