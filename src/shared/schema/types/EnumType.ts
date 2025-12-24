import { ENUM_DISCRIMINATOR_KEY } from "../declarations/EnumDecl.ts"
import {
  getReferencesSerialized,
  resolveSerializedTypeArguments,
  type GetReferencesSerialized,
  type NodeKind,
  type SerializedTypeArgumentsResolver,
} from "../Node.ts"
import type { SerializedBaseType, SerializedType } from "./Type.ts"

export interface SerializedEnumType<
  T extends Record<string, SerializedEnumCaseDecl> = Record<string, SerializedEnumCaseDecl>,
> extends SerializedBaseType {
  kind: NodeKind["EnumType"]
  values: T
}

export interface SerializedEnumCaseDecl<T extends SerializedType | null = SerializedType | null> {
  kind: NodeKind["EnumCaseDecl"]
  type: T
  comment?: string
  isDeprecated?: boolean
}

export const resolveTypeArgumentsInSerializedEnumType: SerializedTypeArgumentsResolver<
  SerializedEnumType
> = (decls, args, type) => ({
  ...type,
  values: Object.fromEntries(
    Object.entries(type.values).map(([key, { type, ...caseMember }]) => [
      key,
      {
        ...caseMember,
        type: type === null ? null : resolveSerializedTypeArguments(decls, args, type),
      },
    ]),
  ),
})

export const getReferencesForSerializedEnumType: GetReferencesSerialized<SerializedEnumType> = (
  decls,
  type,
  value,
) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !(ENUM_DISCRIMINATOR_KEY in value)
  ) {
    return []
  }

  const enumCase = value[ENUM_DISCRIMINATOR_KEY]

  return typeof enumCase === "string" &&
    enumCase in type.values &&
    type.values[enumCase] !== undefined &&
    type.values[enumCase].type !== null &&
    enumCase in value
    ? getReferencesSerialized(
        decls,
        type.values[enumCase].type,
        (value as Record<string, unknown>)[enumCase],
      )
    : []
}
