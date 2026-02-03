import { NodeKind } from "../../../../shared/schema/Node.ts"
import type { NumberConstraints, RangeBound } from "../../../../shared/validation/number.ts"
import { validateOption } from "../../validation/options.ts"
import type { Node } from "../index.ts"
import type { BaseType } from "./Type.ts"

export interface IntegerType extends BaseType, NumberConstraints {
  kind: NodeKind["IntegerType"]
}

const isIntegerRangeBoundOption = (option: RangeBound) =>
  Number.isInteger(typeof option === "number" ? option : option.value)

export const IntegerType = (options: NumberConstraints = {}): IntegerType => ({
  kind: NodeKind.IntegerType,
  minimum: validateOption(options.minimum, "minimum", isIntegerRangeBoundOption),
  maximum: validateOption(options.maximum, "maximum", isIntegerRangeBoundOption),
  multipleOf: options.multipleOf,
})

export { IntegerType as Integer }

export const isIntegerType = (node: Node): node is IntegerType => node.kind === NodeKind.IntegerType
