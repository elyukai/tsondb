import { Node, NodeKind } from "../../Node.js"
import { parallelizeErrors, Validator } from "../../validation/type.js"
import { BaseType } from "../Type.js"

export interface StringType extends BaseType {
  kind: typeof NodeKind.StringType
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  isMarkdown?: boolean
}

export const StringType = (
  options: {
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    isMarkdown?: boolean
  } = {},
): StringType => ({
  kind: NodeKind.StringType,
  ...options,
})

export { StringType as String }

export const isStringType = (node: Node): node is StringType => node.kind === NodeKind.StringType

export const validateStringType: Validator<StringType> = (_helpers, type, value) => {
  if (typeof value !== "string") {
    return [TypeError(`expected a string, but got ${JSON.stringify(value)}`)]
  }

  return parallelizeErrors([
    type.minLength !== undefined && value.length < type.minLength
      ? RangeError(
          `expected a string with at least ${type.minLength} character${
            type.minLength === 1 ? "" : "s"
          }, but got ${value.length} character${value.length === 1 ? "" : "s"}`,
        )
      : undefined,
    type.maxLength !== undefined && value.length > type.maxLength
      ? RangeError(
          `expected a string with at most ${type.maxLength} character${
            type.maxLength === 1 ? "" : "s"
          }, but got ${value.length} character${value.length === 1 ? "" : "s"}`,
        )
      : undefined,
    type.pattern !== undefined && !type.pattern.test(value)
      ? TypeError(`string does not match the pattern ${type.pattern}`)
      : undefined,
  ])
}
