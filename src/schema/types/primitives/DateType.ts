import { Node, NodeKind } from "../../Node.js"
import { parallelizeErrors, Validator } from "../../validation/type.js"
import { BaseType } from "../Type.js"

export interface DateType extends BaseType {
  kind: typeof NodeKind.DateType
}

export const DateType = (): DateType => ({
  kind: NodeKind.DateType,
})

export { DateType as Date }

export const isDateType = (node: Node): node is DateType => node.kind === NodeKind.DateType

export const validateDateType: Validator<DateType> = (_helpers, _type, value) => {
  if (typeof value !== "string") {
    return [TypeError(`expected a string, but got ${JSON.stringify(value)}`)]
  }

  return parallelizeErrors([
    isNaN(new Date(value).getTime())
      ? TypeError(`invalid ISO 8601 date string: ${value}`)
      : undefined,
  ])
}
