import type { DateConstraints } from "../../../../shared/validation/date.ts"
import { validateDateConstraints } from "../../../../shared/validation/date.ts"
import { json } from "../../../utils/errorFormatting.ts"
import type { GetReferences, GetReferencesSerialized, Node, Serializer } from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import type { Validator } from "../../validation/type.ts"
import type { BaseType, SerializedBaseType, StructureFormatter } from "../Type.ts"
import { removeParentKey } from "../Type.ts"

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

export const validateDateType: Validator<DateType> = (helpers, type, value) => {
  if (typeof value !== "string") {
    return [TypeError(`expected a string, but got ${json(value, helpers.useStyling)}`)]
  }

  return validateDateConstraints(type, value)
}

export const serializeDateType: Serializer<DateType, SerializedDateType> = type =>
  removeParentKey(type)

export const getReferencesForDateType: GetReferences<DateType> = (_type, _value) => []

export const getReferencesForSerializedDateType: GetReferencesSerialized<SerializedDateType> = (
  _type,
  _value,
) => []

export const formatDateValue: StructureFormatter<DateType> = (_type, value) => value
