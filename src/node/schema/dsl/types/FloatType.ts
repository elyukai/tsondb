import { NodeKind } from "../../../../shared/schema/Node.ts"
import type { NumberConstraints } from "../../../../shared/validation/number.ts"
import type { Node } from "../index.ts"
import type { BaseType } from "./Type.ts"

export interface FloatConstraints extends NumberConstraints {
  fractionDigits?: number
}

export interface FloatType extends BaseType, FloatConstraints {
  kind: NodeKind["FloatType"]
}

export const FloatType = (options: FloatConstraints = {}): FloatType => {
  if (
    options.fractionDigits !== undefined &&
    (!Number.isInteger(options.fractionDigits) || options.fractionDigits < 1)
  ) {
    throw new TypeError("The fractionDigits option must be a positive integer")
  }

  return {
    ...options,
    kind: NodeKind.FloatType,
  }
}

export { FloatType as Float }

export const isFloatType = (node: Node): node is FloatType => node.kind === NodeKind.FloatType
