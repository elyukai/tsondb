import { json } from "../../../utils/errorFormatting.ts"
import type { GetReferences, Node, Serializer } from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import type { Validator } from "../../validation/type.ts"
import type { BaseType, SerializedBaseType, StructureFormatter } from "../Type.ts"
import { removeParentKey } from "../Type.ts"

export interface BooleanType extends BaseType {
  kind: NodeKind["BooleanType"]
}

export interface SerializedBooleanType extends SerializedBaseType {
  kind: NodeKind["BooleanType"]
}

export const BooleanType = (): BooleanType => ({
  kind: NodeKind.BooleanType,
})

export { BooleanType as Boolean }

export const isBooleanType = (node: Node): node is BooleanType => node.kind === NodeKind.BooleanType

export const validateBooleanType: Validator<BooleanType> = (helpers, _type, value) => {
  if (typeof value !== "boolean") {
    return [TypeError(`expected a boolean value, but got ${json(value, helpers.useStyling)}`)]
  }

  return []
}

export const serializeBooleanType: Serializer<BooleanType, SerializedBooleanType> = type =>
  removeParentKey(type)

export const getReferencesForBooleanType: GetReferences<BooleanType> = (_type, _value) => []

export const formatBooleanValue: StructureFormatter<BooleanType> = (_type, value) => value
