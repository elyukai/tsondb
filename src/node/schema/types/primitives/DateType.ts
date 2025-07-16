import type { DateConstraints } from "../../../../shared/validation/date.js"
import { validateDateConstraints } from "../../../../shared/validation/date.js"
import { json } from "../../../utils/errorFormatting.ts"
import type { GetReferences, Node, Serializer } from "../../Node.js"
import { NodeKind } from "../../Node.js"
import type { Validator } from "../../validation/type.js"
import type { BaseType, SerializedBaseType, StructureFormatter } from "../Type.js"
import { removeParentKey } from "../Type.js"

export interface DateType extends BaseType, DateConstraints {
  kind: NodeKind["DateType"]
}

export interface SerializedDateType extends SerializedBaseType, DateConstraints {
  kind: NodeKind["DateType"]
}

export const DateType = (options?: DateConstraints): DateType => ({
  ...options,
  kind: NodeKind.DateType,
})

export { DateType as Date }

export const isDateType = (node: Node): node is DateType => node.kind === NodeKind.DateType

export const validateDateType: Validator<DateType> = (_helpers, type, value) => {
  if (typeof value !== "string") {
    return [TypeError(`expected a string, but got ${json(value)}`)]
  }

  return validateDateConstraints(type, value)
}

export const serializeDateType: Serializer<DateType, SerializedDateType> = type =>
  removeParentKey(type)

export const getReferencesForDateType: GetReferences<DateType> = (_type, _value) => []

export const formatDateValue: StructureFormatter<DateType> = (_type, value) => value
