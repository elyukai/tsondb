import type { SerializedMemberDecl } from "../../../../shared/schema/types/ObjectType.ts"
import { sortObjectKeys } from "../../../../shared/utils/object.ts"
import { parallelizeErrors } from "../../../../shared/utils/validation.ts"
import type { ObjectConstraints } from "../../../../shared/validation/object.ts"
import { validateObjectConstraints } from "../../../../shared/validation/object.ts"
import { wrapErrorsIfAny } from "../../../utils/error.ts"
import { json, key as keyColor } from "../../../utils/errorFormatting.ts"
import type {
  CustomConstraintValidator,
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  Serialized,
  SerializedMemberDeclObject,
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
import { isChildEntitiesType } from "../references/ChildEntitiesType.ts"
import type { BaseType, StructureFormatter, Type } from "../Type.ts"
import { checkCustomConstraintsInType, formatValue } from "../Type.ts"

type TConstraint = Record<string, MemberDecl>

export interface ObjectType<T extends TConstraint = TConstraint>
  extends BaseType, ObjectConstraints {
  kind: NodeKind["ObjectType"]
  properties: T
}

const keyPattern = /^[a-zA-Z0-9][a-zA-Z0-9_]*$/

export const ObjectType = <T extends TConstraint>(
  properties: T,
  options: {
    additionalProperties?: boolean
    minProperties?: number
    maxProperties?: number
  } = {},
): ObjectType<T> => {
  const type: ObjectType<T> = {
    ...options,
    kind: NodeKind.ObjectType,
    minProperties: validateOption(
      options.minProperties,
      "minProperties",
      option => Number.isInteger(option) && option >= 0,
    ),
    maxProperties: validateOption(
      options.maxProperties,
      "maxProperties",
      option => Number.isInteger(option) && option >= 0,
    ),
    properties,
  }

  Object.keys(properties).forEach(key => {
    if (!keyPattern.test(key)) {
      throw new TypeError(
        `Invalid object key "${key}". Object keys must not start with an underscore and may only contain letters, digits and underscores. (Pattern: ${keyPattern.source})`,
      )
    }
  })

  return type
}

export { ObjectType as Object }

export const isObjectType: Predicate<ObjectType> = node => node.kind === NodeKind.ObjectType

export const getNestedDeclarationsInObjectType: GetNestedDeclarations<ObjectType> = (
  addedDecls,
  type,
  parentDecl,
) =>
  Object.values(type.properties).reduce(
    (acc, prop) => getNestedDeclarations(acc, prop.type, parentDecl),
    addedDecls,
  )

export const validateObjectType: Validator<ObjectType> = (helpers, inDecls, type, value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`expected an object, but got ${json(value, helpers.useStyling)}`)]
  }

  const expectedKeys = Object.keys(type.properties).filter(
    key => type.properties[key] !== undefined && !isChildEntitiesType(type.properties[key].type),
  )

  return parallelizeErrors([
    ...validateObjectConstraints(type, expectedKeys, value),
    ...expectedKeys.map(key => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const prop = type.properties[key]!

      if (prop.isRequired && !(key in value)) {
        return TypeError(`missing required property ${keyColor(`"${key}"`, helpers.useStyling)}`)
      } else if (prop.isRequired || (value as Record<string, unknown>)[key] !== undefined) {
        return wrapErrorsIfAny(
          `at object key ${keyColor(`"${key}"`, helpers.useStyling)}`,
          validateType(helpers, inDecls, prop.type, (value as Record<string, unknown>)[key]),
        )
      }

      return undefined
    }),
  ])
}

export const resolveTypeArgumentsInObjectType: TypeArgumentsResolver<ObjectType> = (
  args,
  type,
  inDecl,
) =>
  ObjectType(
    Object.fromEntries(
      Object.entries(type.properties).map(
        ([key, config]) =>
          [key, { ...config, type: resolveTypeArguments(args, config.type, inDecl) }] as const,
      ),
    ),
    {
      ...type,
    },
  )

export interface MemberDecl<T extends Type = Type, R extends boolean = boolean> {
  kind: NodeKind["MemberDecl"]
  isRequired: R
  type: T

  /**
   * Changes the appearance of the member’s name in editor forms.
   */
  displayName?: string
  comment?: string
  isDeprecated?: boolean
}

const MemberDecl = <T extends Type, R extends boolean>(
  isRequired: R,
  options: {
    type: T

    /**
     * Changes the appearance of the member’s name in editor forms.
     */
    displayName?: string
    comment?: string
    isDeprecated?: boolean
  },
): MemberDecl<T, R> => ({
  ...options,
  kind: NodeKind.MemberDecl,
  isRequired,
})

export const Required = <T extends Type>(options: {
  /**
   * Changes the appearance of the member’s name in editor forms.
   */
  displayName?: string
  comment?: string
  isDeprecated?: boolean
  type: T
}) => MemberDecl(true, options)

export const Optional = <T extends Type>(options: {
  /**
   * Changes the appearance of the member’s name in editor forms.
   */
  displayName?: string
  comment?: string
  isDeprecated?: boolean
  type: T
}) => MemberDecl(false, options)

export const serializeObjectType = <P extends TConstraint>(
  type: ObjectType<P>,
): Serialized<ObjectType<P>> => ({
  ...type,
  properties: Object.fromEntries(
    Object.entries(type.properties).map(([key, prop]): [string, SerializedMemberDecl] => [
      key,
      {
        ...prop,
        type: serializeNode(prop.type),
      },
    ]),
  ) as SerializedMemberDeclObject<P>,
})

export const getReferencesForObjectType: GetReferences<ObjectType> = (type, value, inDecl) =>
  typeof value === "object" && value !== null
    ? Object.entries(value).flatMap(([key, propValue]) =>
        type.properties[key] ? getReferences(type.properties[key].type, propValue, inDecl) : [],
      )
    : []

export const formatObjectValue: StructureFormatter<ObjectType> = (type, value) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? sortObjectKeys(
        Object.fromEntries(
          Object.entries(value).map(([key, item]) => [
            key,
            type.properties[key] ? formatValue(type.properties[key].type, item) : item,
          ]),
        ),
        Object.keys(type.properties),
      )
    : value

export const checkCustomConstraintsInObjectType: CustomConstraintValidator<ObjectType> = (
  type,
  value,
  helpers,
) =>
  typeof value === "object" && value !== null
    ? Object.entries(value).flatMap(([key, propValue]) =>
        type.properties[key]
          ? checkCustomConstraintsInType(type.properties[key].type, propValue, helpers)
          : [],
      )
    : []
