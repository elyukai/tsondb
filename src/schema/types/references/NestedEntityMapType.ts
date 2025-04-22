import { parallelizeErrors } from "../../../shared/utils/validation.js"
import { wrapErrorsIfAny } from "../../../utils/error.js"
import { Lazy } from "../../../utils/lazy.js"
import { GetNestedDeclarations } from "../../declarations/Declaration.js"
import { EntityDecl } from "../../declarations/EntityDecl.js"
import { GetReferences, Node, NodeKind, Serializer } from "../../Node.js"
import { Validator } from "../../validation/type.js"
import {
  getNestedDeclarationsInObjectType,
  getReferencesForObjectType,
  MemberDecl,
  ObjectType,
  resolveTypeArgumentsInObjectType,
  SerializedMemberDecl,
  SerializedObjectType,
  serializeObjectType,
  validateObjectType,
} from "../generic/ObjectType.js"
import { BaseType, removeParentKey, SerializedBaseType, SerializedType, Type } from "../Type.js"

type TConstraint = Record<string, MemberDecl<Type, boolean>>

export interface NestedEntityMapType<
  Name extends string = string,
  T extends TConstraint = TConstraint,
> extends BaseType {
  kind: NodeKind["NestedEntityMapType"]
  name: Name
  comment?: string
  secondaryEntity: EntityDecl
  type: Lazy<ObjectType<T>>
}

type TSerializedConstraint = Record<string, SerializedMemberDecl<SerializedType, boolean>>

export interface SerializedNestedEntityMapType<
  Name extends string = string,
  T extends TSerializedConstraint = TSerializedConstraint,
> extends SerializedBaseType {
  kind: NodeKind["NestedEntityMapType"]
  name: Name
  comment?: string
  secondaryEntity: string
  type: SerializedObjectType<T>
}

export const NestedEntityMapType = <Name extends string, T extends TConstraint>(options: {
  name: Name
  comment?: string
  secondaryEntity: EntityDecl
  type: ObjectType<T>
}): NestedEntityMapType<Name, T> => {
  const nestedEntityMapType: NestedEntityMapType<Name, T> = {
    ...options,
    kind: NodeKind.NestedEntityMapType,
    type: Lazy.of(() => {
      const type = options.type
      type.parent = nestedEntityMapType
      return type
    }),
  }

  return nestedEntityMapType
}

export { NestedEntityMapType as NestedEntityMap }

const _NestedEntityMapType = <Name extends string, T extends TConstraint>(options: {
  name: Name
  comment?: string
  secondaryEntity: EntityDecl
  type: () => ObjectType<T>
}): NestedEntityMapType<Name, T> => {
  const nestedEntityMapType: NestedEntityMapType<Name, T> = {
    ...options,
    kind: NodeKind.NestedEntityMapType,
    type: Lazy.of(() => {
      const type = options.type()
      type.parent = nestedEntityMapType
      return type
    }),
  }

  return nestedEntityMapType
}

export const isNestedEntityMapType = (node: Node): node is NestedEntityMapType =>
  node.kind === NodeKind.NestedEntityMapType

export const getNestedDeclarationsInNestedEntityMapType: GetNestedDeclarations<
  NestedEntityMapType
> = (isDeclAdded, type) => [
  type.secondaryEntity,
  ...getNestedDeclarationsInObjectType(isDeclAdded, type.type.value),
]

export const validateNestedEntityMapType: Validator<NestedEntityMapType> = (
  helpers,
  type,
  value,
) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`expected an object, but got ${JSON.stringify(value)}`)]
  }

  return parallelizeErrors(
    Object.keys(value).map(key =>
      wrapErrorsIfAny(
        `at nested entity map "${type.name}" at key "${key}"`,
        validateObjectType(helpers, type.type.value, value[key as keyof typeof value]).concat(
          helpers.checkReferentialIntegrity({
            name: type.secondaryEntity.name,
            value: key,
          }),
        ),
      ),
    ),
  )
}

export const resolveTypeArgumentsInNestedEntityMapType = (
  args: Record<string, Type>,
  type: NestedEntityMapType,
): NestedEntityMapType =>
  _NestedEntityMapType({
    ...type,
    type: () => resolveTypeArgumentsInObjectType(args, type.type.value),
  })

export const serializeNestedEntityMapType: Serializer<
  NestedEntityMapType,
  SerializedNestedEntityMapType
> = type => ({
  ...removeParentKey(type),
  secondaryEntity: type.secondaryEntity.name,
  type: serializeObjectType(type.type.value),
})

export const getReferencesForNestedEntityMapType: GetReferences<NestedEntityMapType> = (
  type,
  value,
) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? Object.values(value)
        .flatMap(item => getReferencesForObjectType(type.type.value, item))
        .concat(Object.keys(value))
    : []
