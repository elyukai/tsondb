import { ENUM_DISCRIMINATOR_KEY } from "../../../../shared/schema/declarations/EnumDecl.ts"
import { parallelizeErrors } from "../../../../shared/utils/validation.ts"
import { wrapErrorsIfAny } from "../../../utils/error.ts"
import { json, key } from "../../../utils/errorFormatting.ts"
import type {
  CustomConstraintValidator,
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
import type { BaseType, StructureFormatter, Type } from "../Type.ts"
import { checkCustomConstraintsInType, formatValue } from "../Type.ts"

export interface EnumType<
  T extends Record<string, EnumCaseDecl> = Record<string, EnumCaseDecl>,
> extends BaseType {
  kind: NodeKind["EnumType"]
  values: T
}

export const EnumType = <T extends Record<string, EnumCaseDecl> = Record<string, EnumCaseDecl>>(
  values: T,
): EnumType<T> => ({
  kind: NodeKind.EnumType,
  values,
})

export const isEnumType: Predicate<EnumType> = node => node.kind === NodeKind.EnumType

export const getNestedDeclarationsInEnumType: GetNestedDeclarations<EnumType> = (
  addedDecls,
  type,
  parentDecl,
) =>
  Object.values(type.values).reduce(
    (acc, caseMember) =>
      caseMember.type === null ? acc : getNestedDeclarations(acc, caseMember.type, parentDecl),
    addedDecls,
  )

export const validateEnumType: Validator<EnumType> = (helpers, inDecls, type, value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`expected an object, but got ${json(value, helpers.useStyling)}`)]
  }

  const actualKeys = Object.keys(value)

  if (!(ENUM_DISCRIMINATOR_KEY in value) || typeof value[ENUM_DISCRIMINATOR_KEY] !== "string") {
    return [
      TypeError(
        `missing required discriminator value at key ${key(`"${ENUM_DISCRIMINATOR_KEY}"`, helpers.useStyling)} of type string`,
      ),
    ]
  }

  const caseName = value[ENUM_DISCRIMINATOR_KEY]

  if (!(caseName in type.values)) {
    return [
      TypeError(
        `discriminator ${key(`"${caseName}"`, helpers.useStyling)} is not a valid enum case, possible cases are: ${Object.keys(type.values).join(", ")}`,
      ),
    ]
  }

  const unknownKeyErrors = actualKeys.flatMap(actualKey =>
    actualKey === ENUM_DISCRIMINATOR_KEY || actualKey in type.values
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
          inDecls,
          associatedType,
          (value as Record<typeof caseName, unknown>)[caseName],
        ),
      ),
    ])
  }

  return []
}

export const resolveTypeArgumentsInEnumType: TypeArgumentsResolver<EnumType> = (
  args,
  type,
  inDecl,
) =>
  EnumType(
    Object.fromEntries(
      Object.entries(type.values).map(([key, { type, ...caseMember }]) => [
        key,
        {
          ...caseMember,
          type: type === null ? null : resolveTypeArguments(args, type, inDecl),
        },
      ]),
    ),
  )

export interface EnumCaseDecl<T extends Type | null = Type | null> {
  kind: NodeKind["EnumCaseDecl"]
  type: T

  /**
   * Changes the appearance of the enum case’s name in editor forms.
   */
  displayName?: string
  comment?: string
  isDeprecated?: boolean
}

export const EnumCaseDecl = <T extends Type | null>(options: {
  type: T

  /**
   * Changes the appearance of the enum case’s name in editor forms.
   */
  displayName?: string
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

export const getReferencesForEnumType: GetReferences<EnumType> = (type, value, inDecl) => {
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
    ? getReferences(
        type.values[enumCase].type,
        (value as Record<string, unknown>)[enumCase],
        inDecl,
      )
    : []
}

export const formatEnumType: StructureFormatter<EnumType> = (type, value) => {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    ENUM_DISCRIMINATOR_KEY in value &&
    typeof value[ENUM_DISCRIMINATOR_KEY] === "string"
  ) {
    const caseName = value[ENUM_DISCRIMINATOR_KEY]
    const caseValue = (value as Record<typeof caseName, unknown>)[caseName]
    const caseType = type.values[caseName]?.type

    return {
      [ENUM_DISCRIMINATOR_KEY]: caseName,
      ...(caseValue == null || caseType == null
        ? {}
        : { [caseName]: formatValue(caseType, caseValue) }),
    }
  }

  return value
}

export const checkCustomConstraintsInEnumType: CustomConstraintValidator<EnumType> = (
  type,
  value,
  helpers,
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
    ? checkCustomConstraintsInType(
        type.values[enumCase].type,
        (value as Record<string, unknown>)[enumCase],
        helpers,
      )
    : []
}
