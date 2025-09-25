import {
  getReferencesSerialized,
  resolveSerializedTypeArguments,
  type GetReferencesSerialized,
  type NodeKind,
  type SerializedTypeArgumentsResolver,
} from "../Node.ts"
import type { SerializedBaseType, SerializedType } from "./Type.ts"

export interface SerializedArrayType<T extends SerializedType = SerializedType>
  extends SerializedBaseType {
  kind: NodeKind["ArrayType"]
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  items: T
}

export const resolveTypeArgumentsInSerializedArrayType: SerializedTypeArgumentsResolver<
  SerializedArrayType
> = (decls, args, type) => ({
  ...type,
  items: resolveSerializedTypeArguments(decls, args, type.items),
})

export const getReferencesForSerializedArrayType: GetReferencesSerialized<SerializedArrayType> = (
  decls,
  type,
  value,
) =>
  Array.isArray(value)
    ? value.flatMap(item => getReferencesSerialized(decls, type.items, item))
    : []
