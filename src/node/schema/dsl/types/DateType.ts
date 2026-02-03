import { NodeKind } from "../../../../shared/schema/Node.ts"
import type { DateConstraints } from "../../../../shared/validation/date.ts"
import type { Node } from "../index.ts"
import type { BaseType } from "./Type.ts"

export interface DateType extends BaseType, DateConstraints {
  kind: NodeKind["DateType"]
}

export const DateType = (options?: DateConstraints): DateType => ({
  ...options,
  kind: NodeKind.DateType,
})

export { DateType as Date }

export const isDateType = (node: Node): node is DateType => node.kind === NodeKind.DateType
