import { discriminatorKey } from "../../../../shared/enum.ts"
import { parallelizeErrors } from "../../../../shared/utils/validation.ts"
import { wrapErrorsIfAny } from "../../../utils/error.ts"
import { json, key } from "../../../utils/errorFormatting.ts"
import type {
  Copier,
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  Serializer,
  TypeArgumentsResolver,
  Validator,
} from "../../Node.ts"
import {
  copyType,
  getNestedDeclarations,
  getReferences,
  NodeKind,
  resolveTypeArguments,
  serializeNode,
  validateType,
} from "../../Node.ts"
import type { BaseType, StructureFormatter, Type } from "../Type.ts"
import { formatValue } from "../Type.ts"

export interface EnumType<T extends Record<string, EnumCaseDecl> = Record<string, EnumCaseDecl>>
  extends BaseType {
  kind: NodeKind["EnumType"]
  values: T
}

export const EnumType = <T extends Record<string, EnumCaseDecl> = Record<string, EnumCaseDecl>>(
  values: T,
): EnumType<T> => ({
  kind: NodeKind.EnumType,
  values: Object.fromEntries(
    Object.entries(values).map(([key, caseDef]) => [
      key,
      {
        ...caseDef,
        type: caseDef.type === null ? null : copyType(caseDef.type),
      },
    ]),
  ) as T,
})

export const isEnumType: Predicate<EnumType> = node => node.kind === NodeKind.EnumType

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
    return [TypeError(`expected an object, but got ${json(value, helpers.useStyling)}`)]
  }

  const actualKeys = Object.keys(value)

  if (!(discriminatorKey in value) || typeof value[discriminatorKey] !== "string") {
    return [
      TypeError(
        `missing required discriminator value at key ${key(`"${discriminatorKey}"`, helpers.useStyling)} of type string`,
      ),
    ]
  }

  const caseName = value[discriminatorKey]

  if (!(caseName in type.values)) {
    return [
      TypeError(
        `discriminator ${key(`"${caseName}"`, helpers.useStyling)} is not a valid enum case, possible cases are: ${Object.keys(type.values).join(", ")}`,
      ),
    ]
  }

  const unknownKeyErrors = actualKeys.flatMap(actualKey =>
    actualKey === discriminatorKey || actualKey in type.values
      ? []
      : [
          TypeError(
            `key ${key(`"${actualKey}"`, helpers.useStyling)} is not the discriminator key ${key(`"${caseName}"`, helpers.useStyling)} or a valid enum case, possible cases are: ${Object.keys(type.values).join(", ")}`,
          ),
        ],
  )

  if (unknownKeyErrors.length > 0) {
    return unknownKeyErrors
  }

  const associatedType = type.values[caseName]?.type

  if (associatedType != null) {
    if (!(caseName in value)) {
      return [
        TypeError(
          `missing required associated value for case ${key(`"${caseName}"`, helpers.useStyling)}`,
        ),
      ]
    }

    return parallelizeErrors([
      wrapErrorsIfAny(
        `at enum case ${key(`"${caseName}"`, helpers.useStyling)}`,
        validateType(
          helpers,
          associatedType,
          (value as Record<typeof caseName, unknown>)[caseName],
        ),
      ),
    ])
  }

  return []
}

export const resolveTypeArgumentsInEnumType: TypeArgumentsResolver<EnumType> = (args, type) =>
  EnumType(
    Object.fromEntries(
      Object.entries(type.values).map(([key, { type, ...caseMember }]) => [
        key,
        {
          ...caseMember,
          type: type === null ? null : resolveTypeArguments(args, type),
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

export const EnumCaseDecl = <T extends Type | null>(options: {
  type: T
  comment?: string
  isDeprecated?: boolean
}): EnumCaseDecl<T> => ({
  ...options,
  kind: NodeKind.EnumCaseDecl,
})

export { EnumCaseDecl as EnumCase }

export const serializeEnumType: Serializer<EnumType> = type => ({
  ...type,
  values: Object.fromEntries(
    Object.entries(type.values).map(([key, caseMember]) => [
      key,
      {
        ...caseMember,
        type: caseMember.type === null ? null : serializeNode(caseMember.type),
      },
    ]),
  ),
})

export const getReferencesForEnumType: GetReferences<EnumType> = (type, value) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !(discriminatorKey in value)
  ) {
    return []
  }

  const enumCase = value[discriminatorKey]

  return typeof enumCase === "string" &&
    enumCase in type.values &&
    type.values[enumCase] !== undefined &&
    type.values[enumCase].type !== null &&
    enumCase in value
    ? getReferences(type.values[enumCase].type, (value as Record<string, unknown>)[enumCase])
    : []
}

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

export const copyEnumTypeNode: Copier<EnumType> = <N extends EnumType>(type: N): N => ({
  ...type,
  values: Object.fromEntries(
    Object.entries(type.values).map(([key, caseDef]) => [
      key,
      {
        ...caseDef,
        type: caseDef.type === null ? null : copyType(caseDef.type),
      },
    ]),
  ),
})
