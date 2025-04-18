import { wrapErrorsIfAny } from "../../../utils/error.js"
import { GetNestedDeclarations, getNestedDeclarations } from "../../declarations/Declaration.js"
import { Node, NodeKind, Serializer } from "../../Node.js"
import { validateOption } from "../../validation/options.js"
import {
  NumerusLabel,
  parallelizeErrors,
  validateLengthRangeBound,
  Validator,
} from "../../validation/type.js"
import {
  BaseType,
  removeParentKey,
  resolveTypeArgumentsInType,
  SerializedBaseType,
  SerializedType,
  serializeType,
  Type,
  validate,
} from "../Type.js"

type TConstraint = Record<string, MemberDecl<Type, boolean>>

export interface ObjectType<T extends TConstraint = TConstraint> extends BaseType {
  kind: NodeKind["ObjectType"]
  properties: T
  additionalProperties?: boolean
  minProperties?: number
  maxProperties?: number
}

type TSerializedConstraint = Record<string, SerializedMemberDecl<SerializedType, boolean>>

export interface SerializedObjectType<T extends TSerializedConstraint = TSerializedConstraint>
  extends SerializedBaseType {
  kind: NodeKind["ObjectType"]
  properties: T
  additionalProperties?: boolean
  minProperties?: number
  maxProperties?: number
}

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
    properties[key]!.type.parent = type
  })

  return type
}

export { ObjectType as Object }

export const isObjectType = (node: Node): node is ObjectType => node.kind === NodeKind.ObjectType

export const getNestedDeclarationsInObjectType: GetNestedDeclarations<ObjectType> = (
  isDeclAdded,
  type,
) => Object.values(type.properties).flatMap(prop => getNestedDeclarations(isDeclAdded, prop.type))

export const validateObjectType: Validator<ObjectType> = (helpers, type, value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`expected an object, but got ${JSON.stringify(value)}`)]
  }

  const keys = Object.keys(type.properties)
  const label = ["property", "properties"] as NumerusLabel

  return parallelizeErrors([
    validateLengthRangeBound("lower", label, type.minProperties, keys),
    validateLengthRangeBound("upper", label, type.maxProperties, keys),
    ...keys.map(key => {
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
}

export interface SerializedMemberDecl<
  T extends SerializedType = SerializedType,
  R extends boolean = boolean,
> {
  kind: NodeKind["MemberDecl"]
  isRequired: R
  type: T
  comment?: string
}

const MemberDecl = <T extends Type, R extends boolean>(
  isRequired: R,
  type: T,
  comment?: string,
): MemberDecl<T, R> => ({
  kind: NodeKind.MemberDecl,
  isRequired,
  type,
  comment,
})

export const Required = <T extends Type>(options: { comment?: string; type: T }) =>
  MemberDecl(true, options.type, options.comment)

export const Optional = <T extends Type>(options: { comment?: string; type: T }) =>
  MemberDecl(false, options.type, options.comment)

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
