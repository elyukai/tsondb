import { parallelizeErrors } from "../../../../shared/utils/validation.ts"
import { validateArrayConstraints } from "../../../../shared/validation/array.ts"
import { wrapErrorsIfAny } from "../../../utils/error.ts"
import { json, key } from "../../../utils/errorFormatting.ts"
import type {
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  Serializer,
  TypeArgumentsResolver,
  Validator,
} from "../../Node.ts"
import {
  getNestedDeclarations,
  getReferences,
  NodeKind,
  resolveTypeArguments,
  serializeNode,
  validateType,
} from "../../Node.ts"
import { validateOption } from "../../validation/options.ts"
import type { BaseType, StructureFormatter, Type } from "../Type.ts"
import { formatValue, removeParentKey, setParent } from "../Type.ts"

export interface ArrayType<T extends Type = Type> extends BaseType {
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

export const isArrayType: Predicate<ArrayType> = node => node.kind === NodeKind.ArrayType

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
        validateType(helpers, type.items, item),
      ),
    ),
  ])
}

export const resolveTypeArgumentsInArrayType: TypeArgumentsResolver<ArrayType> = (args, type) =>
  ArrayType(resolveTypeArguments(args, type.items), {
    ...type,
  })

export const serializeArrayType: Serializer<ArrayType> = type => ({
  ...removeParentKey(type),
  items: serializeNode(type.items),
})

export const getReferencesForArrayType: GetReferences<ArrayType> = (type, value) =>
  Array.isArray(value) ? value.flatMap(item => getReferences(type.items, item)) : []

export const formatArrayValue: StructureFormatter<ArrayType> = (type, value) =>
  Array.isArray(value) ? value.map(item => formatValue(type.items, item)) : value
