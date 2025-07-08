import { RangeBound, validateNumberConstraints } from "../../../../shared/validation/number.js"
import { GetReferences, Node, NodeKind, Serializer } from "../../Node.js"
import { validateOption } from "../../validation/options.js"
import { Validator } from "../../validation/type.js"
import { BaseType, removeParentKey, SerializedBaseType, StructureFormatter } from "../Type.js"

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

export const validateIntegerType: Validator<IntegerType> = (_helpers, type, value) => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return [TypeError(`expected an integer, but got ${JSON.stringify(value)}`)]
  }

  return validateNumberConstraints(type, value)
}

export const serializeIntegerType: Serializer<IntegerType, SerializedIntegerType> = type =>
  removeParentKey(type)

export const getReferencesForIntegerType: GetReferences<IntegerType> = (_type, _value) => []

export const formatIntegerValue: StructureFormatter<IntegerType> = (_type, value) => value
