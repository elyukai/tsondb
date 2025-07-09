import { sortObjectKeys } from "../../../../shared/utils/object.js"
import { parallelizeErrors } from "../../../../shared/utils/validation.js"
import type { ObjectConstraints } from "../../../../shared/validation/object.js"
import { validateObjectConstraints } from "../../../../shared/validation/object.js"
import { wrapErrorsIfAny } from "../../../utils/error.js"
import type { GetNestedDeclarations } from "../../declarations/Declaration.js"
import { getNestedDeclarations } from "../../declarations/Declaration.js"
import type { GetReferences, Node, Serializer } from "../../Node.js"
import { NodeKind } from "../../Node.js"
import { validateOption } from "../../validation/options.js"
import type { Validator } from "../../validation/type.js"
import type {
  BaseType,
  SerializedBaseType,
  SerializedType,
  StructureFormatter,
  Type,
} from "../Type.js"
import {
  getReferencesForType,
  removeParentKey,
  resolveTypeArgumentsInType,
  serializeType,
  validate,
} from "../Type.js"

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
    properties[key]!.type.parent = type
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
    return [TypeError(`expected an object, but got ${JSON.stringify(value)}`)]
  }

  const expectedKeys = Object.keys(type.properties)

  return parallelizeErrors([
    ...validateObjectConstraints(type, expectedKeys, value),
    ...expectedKeys.map(key => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const prop = type.properties[key]!

      if (prop.isRequired && !(key in value)) {
        return TypeError(`missing required property "${key}"`)
      } else if (prop.isRequired || (value as Record<string, unknown>)[key] !== undefined) {
        return wrapErrorsIfAny(
          `at object key "${key}"`,
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        key in type.properties ? getReferencesForType(type.properties[key]!.type, propValue) : [],
      )
    : []

export const formatObjectValue: StructureFormatter<ObjectType> = (type, value) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? sortObjectKeys(value as Record<string, unknown>, Object.keys(type.properties))
    : value
