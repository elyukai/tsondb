import type { StringConstraints } from "../../../../shared/validation/string.ts"
import { validateStringConstraints } from "../../../../shared/validation/string.ts"
import { json } from "../../../utils/errorFormatting.ts"
import type { GetReferences, Node, Serializer } from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import type { Validator } from "../../validation/type.ts"
import type { BaseType, SerializedBaseType, StructureFormatter } from "../Type.ts"
import { removeParentKey } from "../Type.ts"

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

export const validateStringType: Validator<StringType> = (helpers, type, value) => {
  if (typeof value !== "string") {
    return [TypeError(`expected a string, but got ${json(value, helpers.useStyling)}`)]
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
