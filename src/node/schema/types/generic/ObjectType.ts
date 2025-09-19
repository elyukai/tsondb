import { sortObjectKeys } from "../../../../shared/utils/object.ts"
import { parallelizeErrors } from "../../../../shared/utils/validation.ts"
import type { ObjectConstraints } from "../../../../shared/validation/object.ts"
import { validateObjectConstraints } from "../../../../shared/validation/object.ts"
import { wrapErrorsIfAny } from "../../../utils/error.ts"
import { json, key as keyColor } from "../../../utils/errorFormatting.ts"
import type { GetNestedDeclarations, SerializedDecl } from "../../declarations/Declaration.ts"
import { getNestedDeclarations } from "../../declarations/Declaration.ts"
import type { GetReferences, GetReferencesSerialized, Node, Serializer } from "../../Node.ts"
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
  getReferencesForSerializedType,
  getReferencesForType,
  removeParentKey,
  resolveTypeArgumentsInSerializedType,
  resolveTypeArgumentsInType,
  serializeType,
  setParent,
  validate,
} from "../Type.ts"

type TConstraint = Record<string, MemberDecl>

export interface ObjectType<T extends TConstraint = TConstraint>
  extends BaseType,
    ObjectConstraints {
  kind: NodeKind["ObjectType"]
  properties: T
}

type TSerializedConstraint = Record<string, SerializedMemberDecl>

export interface SerializedObjectType<T extends TSerializedConstraint = TSerializedConstraint>
  extends SerializedBaseType,
    ObjectConstraints {
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setParent(properties[key]!.type, type)
  })

  return type
}

export { ObjectType as Object }

export const isObjectType = (node: Node): node is ObjectType => node.kind === NodeKind.ObjectType

export const getNestedDeclarationsInObjectType: GetNestedDeclarations<ObjectType> = (
  addedDecls,
  type,
) =>
  Object.values(type.properties).reduce(
    (acc, prop) => getNestedDeclarations(acc, prop.type),
    addedDecls,
  )

export const validateObjectType: Validator<ObjectType> = (helpers, type, value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`expected an object, but got ${json(value, helpers.useStyling)}`)]
  }

  const expectedKeys = Object.keys(type.properties)

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
          validate(helpers, prop.type, (value as Record<string, unknown>)[key]),
        )
      }

      return undefined
    }),
  ])
}

export const resolveTypeArgumentsInObjectType = (
  args: Record<string, Type>,
  type: ObjectType,
): ObjectType =>
  ObjectType(
    Object.fromEntries(
      Object.entries(type.properties).map(
        ([key, config]) =>
          [key, { ...config, type: resolveTypeArgumentsInType(args, config.type) }] as const,
      ),
    ),
    {
      ...type,
    },
  )

export const resolveTypeArgumentsInSerializedObjectType = (
  args: Record<string, SerializedType>,
  type: SerializedObjectType,
  decls: Record<string, SerializedDecl>,
): SerializedObjectType => ({
  ...type,
  properties: Object.fromEntries(
    Object.entries(type.properties).map(
      ([key, config]) =>
        [
          key,
          { ...config, type: resolveTypeArgumentsInSerializedType(args, config.type, decls) },
        ] as const,
    ),
  ),
})

export interface MemberDecl<T extends Type = Type, R extends boolean = boolean> {
  kind: NodeKind["MemberDecl"]
  isRequired: R
  type: T
  comment?: string
  isDeprecated?: boolean
}

export interface SerializedMemberDecl<
  T extends SerializedType = SerializedType,
  R extends boolean = boolean,
> {
  kind: NodeKind["MemberDecl"]
  isRequired: R
  type: T
  comment?: string
  isDeprecated?: boolean
}

const MemberDecl = <T extends Type, R extends boolean>(
  isRequired: R,
  type: T,
  comment?: string,
  isDeprecated?: boolean,
): MemberDecl<T, R> => ({
  kind: NodeKind.MemberDecl,
  isRequired,
  type,
  comment,
  isDeprecated,
})

export const Required = <T extends Type>(options: {
  comment?: string
  isDeprecated?: boolean
  type: T
}) => MemberDecl(true, options.type, options.comment, options.isDeprecated)

export const Optional = <T extends Type>(options: {
  comment?: string
  isDeprecated?: boolean
  type: T
}) => MemberDecl(false, options.type, options.comment, options.isDeprecated)

export const serializeObjectType: Serializer<ObjectType, SerializedObjectType> = type => ({
  ...removeParentKey(type),
  properties: Object.fromEntries(
    Object.entries(type.properties).map(([key, prop]) => [
      key,
      {
        ...prop,
        type: serializeType(prop.type),
      },
    ]),
  ),
})

export const getReferencesForObjectType: GetReferences<ObjectType> = (type, value) =>
  typeof value === "object" && value !== null
    ? Object.entries(value).flatMap(([key, propValue]) =>
        type.properties[key] ? getReferencesForType(type.properties[key].type, propValue) : [],
      )
    : []

export const getReferencesForSerializedObjectType: GetReferencesSerialized<SerializedObjectType> = (
  type,
  value,
  decls,
) =>
  typeof value === "object" && value !== null
    ? Object.entries(value).flatMap(([key, propValue]) =>
        type.properties[key]
          ? getReferencesForSerializedType(type.properties[key].type, propValue, decls)
          : [],
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
