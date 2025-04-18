import { GetReferences, Node, NodeKind, Serializer } from "../../Node.js"
import { Validator } from "../../validation/type.js"
import { BaseType, removeParentKey, SerializedBaseType } from "../Type.js"

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

export const validateBooleanType: Validator<BooleanType> = (_helpers, _type, value) => {
  if (typeof value !== "boolean") {
    return [TypeError(`expected a boolean value, but got ${JSON.stringify(value)}`)]
  }

  return []
}

export const serializeBooleanType: Serializer<BooleanType, SerializedBooleanType> = type =>
  removeParentKey(type)

export const getReferencesForBooleanType: GetReferences<BooleanType> = (_type, _value) => []
