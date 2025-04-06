import { Node, NodeKind } from "../../Node.js"
import { BaseType } from "../Type.js"

export interface StringType extends BaseType {
  kind: typeof NodeKind.StringType
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  isMarkdown?: boolean
}

export const String = (
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

export const isStringType = (node: Node): node is StringType => node.kind === NodeKind.StringType

export const validateStringType = (type: StringType, value: unknown): void => {
  if (typeof value !== "string") {
    throw new TypeError(`Expected a string, but got ${JSON.stringify(value)}`)
  }

  if (type.minLength !== undefined && value.length < type.minLength) {
    throw new RangeError(
      `Expected a string with at least ${type.minLength} character${
        type.minLength === 1 ? "" : "s"
      }, but got ${value.length} character${value.length === 1 ? "" : "s"}`,
    )
  }

  if (type.maxLength !== undefined && value.length > type.maxLength) {
    throw new RangeError(
      `Expected a string with at most ${type.maxLength} character${
        type.maxLength === 1 ? "" : "s"
      }, but got ${value.length} character${value.length === 1 ? "" : "s"}`,
    )
  }

  if (type.pattern !== undefined && !type.pattern.test(value)) {
    throw new TypeError(`String does not match the pattern /${type.pattern}/`)
  }
}
