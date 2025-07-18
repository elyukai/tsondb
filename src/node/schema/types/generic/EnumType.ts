import { discriminatorKey } from "../../../../shared/enum.ts"
import { json, key } from "../../../utils/errorFormatting.ts"
import type { GetNestedDeclarations } from "../../declarations/Declaration.ts"
import { getNestedDeclarations } from "../../declarations/Declaration.ts"
import type { GetReferences, Node, Serializer } from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
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
  validate,
} from "../Type.ts"

export interface EnumType<T extends Record<string, EnumCaseDecl> = Record<string, EnumCaseDecl>>
  extends BaseType {
  kind: NodeKind["EnumType"]
  values: T
}

export interface SerializedEnumType<
  T extends Record<string, SerializedEnumCaseDecl> = Record<string, SerializedEnumCaseDecl>,
> extends SerializedBaseType {
  kind: NodeKind["EnumType"]
  values: T
}

export const EnumType = <T extends Record<string, EnumCaseDecl> = Record<string, EnumCaseDecl>>(
  values: T,
): EnumType<T> => {
  const type: EnumType<T> = {
    kind: NodeKind.EnumType,
    values,
  }

  type.values = Object.fromEntries(
    Object.entries(values).map(([caseName, caseDef]) => [
      caseName,
      { ...caseDef, type: caseDef.type === null ? null : { ...caseDef.type, parent: type } },
    ]),
  ) as T

  return type
}

export const isEnumType = (node: Node): node is EnumType => node.kind === NodeKind.EnumType

export const getNestedDeclarationsInEnumType: GetNestedDeclarations<EnumType> = (
  addedDecls,
  type,
) =>
  Object.values(type.values).reduce(
    (acc, caseMember) =>
      caseMember.type === null ? acc : getNestedDeclarations(acc, caseMember.type),
    addedDecls,
  )

export const validateEnumType: Validator<EnumType> = (helpers, type, value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`expected an object, but got ${json(value)}`)]
  }

  const actualKeys = Object.keys(value)

  if (!(discriminatorKey in value) || typeof value[discriminatorKey] !== "string") {
    return [
      TypeError(
        `missing required discriminator value at key ${key(`"${discriminatorKey}"`)} of type string`,
      ),
    ]
  }

  const caseName = value[discriminatorKey]

  if (!(caseName in type.values)) {
    return [
      TypeError(
        `discriminator ${key(`"${caseName}"`)} is not a valid enum case, possible cases are: ${Object.keys(type.values).join(", ")}`,
      ),
    ]
  }

  const unknownKeyErrors = actualKeys.flatMap(actualKey =>
    actualKey === discriminatorKey || actualKey in type.values
      ? []
      : [
          TypeError(
            `key ${key(`"${actualKey}"`)} is not the discriminator key ${key(`"${caseName}"`)} or a valid enum case, possible cases are: ${Object.keys(type.values).join(", ")}`,
          ),
        ],
  )

  if (unknownKeyErrors.length > 0) {
    return unknownKeyErrors
  }

  const associatedType = type.values[caseName]?.type

  if (associatedType != null) {
    if (!(caseName in value)) {
      return [TypeError(`missing required associated value for case ${key(`"${caseName}"`)}`)]
    }

    return validate(helpers, associatedType, (value as Record<typeof caseName, unknown>)[caseName])
  }

  return []
}

export const resolveTypeArgumentsInEnumType = (
  args: Record<string, Type>,
  type: EnumType,
): EnumType =>
  EnumType(
    Object.fromEntries(
      Object.entries(type.values).map(([key, { type, ...caseMember }]) => [
        key,
        {
          ...caseMember,
          type: type === null ? null : resolveTypeArgumentsInType(args, type),
        },
      ]),
    ),
  )

export interface EnumCaseDecl<T extends Type | null = Type | null> {
  kind: NodeKind["EnumCaseDecl"]
  type: T
  comment?: string
  isDeprecated?: boolean
}

export interface SerializedEnumCaseDecl<T extends SerializedType | null = SerializedType | null> {
  kind: NodeKind["EnumCaseDecl"]
  type: T
  comment?: string
  isDeprecated?: boolean
}

export const EnumCaseDecl = <T extends Type | null>(options: {
  type: T
  comment?: string
  isDeprecated?: boolean
}): EnumCaseDecl<T> => ({
  ...options,
  kind: NodeKind.EnumCaseDecl,
})

export { EnumCaseDecl as EnumCase }

export const serializeEnumType: Serializer<EnumType, SerializedEnumType> = type => ({
  ...removeParentKey(type),
  values: Object.fromEntries(
    Object.entries(type.values).map(([key, caseMember]) => [
      key,
      {
        ...caseMember,
        type: caseMember.type === null ? null : serializeType(caseMember.type),
      },
    ]),
  ),
})

export const getReferencesForEnumType: GetReferences<EnumType> = (type, value) =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  discriminatorKey in value &&
  typeof value[discriminatorKey] === "string" &&
  value[discriminatorKey] in type.values &&
  type.values[value[discriminatorKey]]?.type == null &&
  value[discriminatorKey] in value
    ? getReferencesForType(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        type.values[value[discriminatorKey]]!.type!,
        (value as Record<string, unknown>)[value[discriminatorKey]],
      )
    : []

export const formatEnumType: StructureFormatter<EnumType> = (type, value) => {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    discriminatorKey in value &&
    typeof value[discriminatorKey] === "string"
  ) {
    const caseName = value[discriminatorKey]
    const caseValue = (value as Record<typeof caseName, unknown>)[caseName]
    const caseType = type.values[caseName]?.type

    return {
      [discriminatorKey]: caseName,
      ...(caseValue == null || caseType == null
        ? {}
        : { [caseName]: formatValue(caseType, caseValue) }),
    }
  }

  return value
}
