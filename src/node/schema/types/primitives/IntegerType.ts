import type { RangeBound } from "../../../../shared/validation/number.ts"
import { validateNumberConstraints } from "../../../../shared/validation/number.ts"
import { json } from "../../../utils/errorFormatting.ts"
import type { GetReferences, GetReferencesSerialized, Node, Serializer } from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import { validateOption } from "../../validation/options.ts"
import type { Validator } from "../../validation/type.ts"
import type { BaseType, SerializedBaseType, StructureFormatter } from "../Type.ts"
import { removeParentKey } from "../Type.ts"

export interface IntegerType extends BaseType {
  kind: NodeKind["IntegerType"]
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

export interface SerializedIntegerType extends SerializedBaseType {
  kind: NodeKind["IntegerType"]
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}

const isIntegerRangeBoundOption = (option: RangeBound) =>
  Number.isInteger(typeof option === "number" ? option : option.value)

export const IntegerType = (
  options: {
    minimum?: RangeBound
    maximum?: RangeBound
    multipleOf?: number
  } = {},
): IntegerType => ({
  kind: NodeKind.IntegerType,
  minimum: validateOption(options.minimum, "minimum", isIntegerRangeBoundOption),
  maximum: validateOption(options.maximum, "maximum", isIntegerRangeBoundOption),
  multipleOf: options.multipleOf,
})

export { IntegerType as Integer }

export const isIntegerType = (node: Node): node is IntegerType => node.kind === NodeKind.IntegerType

export const validateIntegerType: Validator<IntegerType> = (helpers, type, value) => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return [TypeError(`expected an integer, but got ${json(value, helpers.useStyling)}`)]
  }

  return validateNumberConstraints(type, value)
}

export const serializeIntegerType: Serializer<IntegerType, SerializedIntegerType> = type =>
  removeParentKey(type)

export const getReferencesForIntegerType: GetReferences<IntegerType> = (_type, _value) => []

export const getReferencesForSerializedIntegerType: GetReferencesSerialized<
  SerializedIntegerType
> = (_type, _value) => []

export const formatIntegerValue: StructureFormatter<IntegerType> = (_type, value) => value
