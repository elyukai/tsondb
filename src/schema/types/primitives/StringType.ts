import { GetReferences, Node, NodeKind, Serializer } from "../../Node.js"
import { parallelizeErrors, Validator } from "../../validation/type.js"
import { BaseType, removeParentKey, SerializedBaseType } from "../Type.js"

export interface StringType extends BaseType {
  kind: NodeKind["StringType"]
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  isMarkdown?: boolean
}

export interface SerializedStringType extends SerializedBaseType {
  kind: NodeKind["StringType"]
  minLength?: number
  maxLength?: number
  pattern?: string
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
  ...options,
  kind: NodeKind.StringType,
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

export const serializeStringType: Serializer<StringType, SerializedStringType> = type =>
  removeParentKey({
    ...type,
    pattern: type.pattern?.source,
  })

export const getReferencesForStringType: GetReferences<StringType> = (_type, _value) => []
