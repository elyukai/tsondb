import { DateConstraints, validateDateConstraints } from "../../../../shared/validation/date.js"
import { GetReferences, Node, NodeKind, Serializer } from "../../Node.js"
import { Validator } from "../../validation/type.js"
import { BaseType, removeParentKey, SerializedBaseType, StructureFormatter } from "../Type.js"

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
    return [TypeError(`expected a string, but got ${JSON.stringify(value)}`)]
  }

  return validateDateConstraints(type, value)
}

export const serializeDateType: Serializer<DateType, SerializedDateType> = type =>
  removeParentKey(type)

export const getReferencesForDateType: GetReferences<DateType> = (_type, _value) => []

export const formatDateValue: StructureFormatter<DateType> = (_type, value) => value
