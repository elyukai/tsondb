import { Decl, getNestedDeclarations } from "../../declarations/Declaration.js"
import { validateOption } from "../../validation/options.js"
import { NodeKind } from "../Node.js"
import { isReferenceIdentifierType } from "../references/ReferenceIdentifierType.js"
import { replaceTypeArguments, Type, validate } from "../Type.js"

export interface ObjectType<T extends Record<string, MemberDecl<Type, boolean>>> {
  kind: typeof NodeKind.ObjectType
  properties: T
  additionalProperties?: boolean
  minProperties?: number
  maxProperties?: number
}

const _Object = {
  Object: <T extends Record<string, MemberDecl<Type, boolean>>>(
    properties: T,
    options: {
      additionalProperties?: boolean
      minProperties?: number
      maxProperties?: number
    } = {},
  ): ObjectType<T> => ({
    kind: NodeKind.ObjectType,
    ...options,
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
  }),
}.Object

export { _Object as Object }

export const isObjectType = (
  type: Type,
): type is ObjectType<Record<string, MemberDecl<Type, boolean>>> =>
  type.kind === NodeKind.ObjectType

export const getNestedDeclarationsInObjectType = (
  type: ObjectType<Record<string, MemberDecl<Type, boolean>>>,
): Decl[] =>
  Object.values(type.properties).flatMap(prop => {
    if (isObjectType(prop.type)) {
      return getNestedDeclarationsInObjectType(prop.type)
    } else if (isReferenceIdentifierType(prop.type)) {
      return [prop.type.entity, ...getNestedDeclarations(prop.type.entity)]
    } else {
      return []
    }
  })

export const validateObjectType = (
  type: ObjectType<Record<string, MemberDecl<Type, boolean>>>,
  value: unknown,
): void => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`Expected an object, but got ${JSON.stringify(value)}`)
  }

  const keys = Object.keys(type.properties)
  if (type.minProperties !== undefined && keys.length < type.minProperties) {
    throw new RangeError(
      `Expected at least ${type.minProperties} propert${
        type.minProperties === 1 ? "y" : "ies"
      }, but got ${keys.length} propert${keys.length === 1 ? "y" : "ies"}`,
    )
  }

  if (type.maxProperties !== undefined && keys.length > type.maxProperties) {
    throw new RangeError(
      `Expected at most ${type.maxProperties} propert${
        type.maxProperties === 1 ? "y" : "ies"
      }, but got ${keys.length} propert${keys.length === 1 ? "y" : "ies"}`,
    )
  }

  for (const key of keys) {
    const prop = type.properties[key]!
    if (!(key in value)) {
      if (prop.isRequired) {
        throw new TypeError(`Missing required property: ${key}`)
      }
    } else {
      try {
        validate(prop.type, (value as Record<string, unknown>)[key])
      } catch (error) {
        throw new TypeError(`at object key "${key}"`, { cause: error })
      }
    }
  }
}

export const replaceTypeArgumentsInObjectType = (
  args: Record<string, Type>,
  type: ObjectType<Record<string, MemberDecl<Type, boolean>>>,
): ObjectType<Record<string, MemberDecl<Type, boolean>>> =>
  _Object(
    Object.fromEntries(
      Object.entries(type.properties).map(
        ([key, config]) =>
          [key, { ...config, type: replaceTypeArguments(args, config.type) }] as const,
      ),
    ),
    {
      ...type,
    },
  )

export interface MemberDecl<T extends Type, R extends boolean> {
  kind: typeof NodeKind.MemberDecl
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
