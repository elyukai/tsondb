import type { StringConstraints } from "../../../../shared/validation/string.js"
import { validateStringConstraints } from "../../../../shared/validation/string.js"
import { json } from "../../../utils/errorFormatting.ts"
import type { GetReferences, Node, Serializer } from "../../Node.js"
import { NodeKind } from "../../Node.js"
import type { Validator } from "../../validation/type.js"
import type { BaseType, SerializedBaseType, StructureFormatter } from "../Type.js"
import { removeParentKey } from "../Type.js"

export interface StringType extends BaseType, StringConstraints {
  kind: NodeKind["StringType"]
  pattern?: RegExp
  isMarkdown?: boolean
}

export interface SerializedStringType extends SerializedBaseType, StringConstraints {
  kind: NodeKind["StringType"]
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
    return [TypeError(`expected a string, but got ${json(value)}`)]
  }

  return validateStringConstraints(type, value)
}

export const serializeStringType: Serializer<StringType, SerializedStringType> = type =>
  removeParentKey({
    ...type,
    pattern: type.pattern?.source,
  })

export const getReferencesForStringType: GetReferences<StringType> = (_type, _value) => []

export const formatStringValue: StructureFormatter<StringType> = (_type, value) => value
