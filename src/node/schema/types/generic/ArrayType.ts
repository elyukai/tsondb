import { parallelizeErrors } from "../../../../shared/utils/validation.ts"
import { validateArrayConstraints } from "../../../../shared/validation/array.ts"
import { wrapErrorsIfAny } from "../../../utils/error.ts"
import { json, key } from "../../../utils/errorFormatting.ts"
import type { GetNestedDeclarations } from "../../declarations/Declaration.ts"
import { getNestedDeclarations } from "../../declarations/Declaration.ts"
import type { GetReferences, Node, Serializer } from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import { validateOption } from "../../validation/options.ts"
import type { Validator } from "../../validation/type.ts"
import type {
  BaseType,
  SerializedBaseType,
  SerializedType,
  StructureFormatter,
  Type,
} from "../Type.ts"
import {
  formatValue,
  getReferencesForType,
  removeParentKey,
  resolveTypeArgumentsInType,
  serializeType,
  setParent,
  validate,
} from "../Type.ts"

export interface ArrayType<T extends Type = Type> extends BaseType {
  kind: NodeKind["ArrayType"]
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  items: T
}

export interface SerializedArrayType<T extends SerializedType = SerializedType>
  extends SerializedBaseType {
  kind: NodeKind["ArrayType"]
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  items: T
}

export const ArrayType = <T extends Type>(
  items: T,
  options: {
    minItems?: number
    maxItems?: number
    uniqueItems?: boolean
  } = {},
): ArrayType<T> => {
  const type: ArrayType<T> = {
    ...options,
    kind: NodeKind.ArrayType,
    minItems: validateOption(
      options.minItems,
      "minItems",
      option => Number.isInteger(option) && option >= 0,
    ),
    maxItems: validateOption(
      options.maxItems,
      "maxItems",
      option => Number.isInteger(option) && option >= 0,
    ),
    items,
  }

  setParent(type.items, type)

  return type
}

export { ArrayType as Array }

export const isArrayType = (node: Node): node is ArrayType => node.kind === NodeKind.ArrayType

export const getNestedDeclarationsInArrayType: GetNestedDeclarations<ArrayType> = (
  addedDecls,
  type,
) => getNestedDeclarations(addedDecls, type.items)

export const validateArrayType: Validator<ArrayType> = (helpers, type, value) => {
  if (!Array.isArray(value)) {
    return [TypeError(`expected an array, but got ${json(value, helpers.useStyling)}`)]
  }

  return parallelizeErrors([
    ...validateArrayConstraints(type, value),
    ...value.map((item, index) =>
      wrapErrorsIfAny(
        `at index ${key(index.toString(), helpers.useStyling)}`,
        validate(helpers, type.items, item),
      ),
    ),
  ])
}

export const resolveTypeArgumentsInArrayType = (
  args: Record<string, Type>,
  type: ArrayType,
): ArrayType =>
  ArrayType(resolveTypeArgumentsInType(args, type.items), {
    ...type,
  })

export const serializeArrayType: Serializer<ArrayType, SerializedArrayType> = type => ({
  ...removeParentKey(type),
  items: serializeType(type.items),
})

export const getReferencesForArrayType: GetReferences<ArrayType> = (type, value) =>
  Array.isArray(value) ? value.flatMap(item => getReferencesForType(type.items, item)) : []

export const formatArrayValue: StructureFormatter<ArrayType> = (type, value) =>
  Array.isArray(value) ? value.map(item => formatValue(type.items, item)) : value
