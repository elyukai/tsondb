import { Lazy } from "../../../../shared/utils/lazy.ts"
import { sortObjectKeysAlphabetically } from "../../../../shared/utils/object.ts"
import { parallelizeErrors } from "../../../../shared/utils/validation.ts"
import { wrapErrorsIfAny } from "../../../utils/error.ts"
import { entity, json, key as keyColor } from "../../../utils/errorFormatting.ts"
import type { GetNestedDeclarations, SerializedDecl } from "../../declarations/Declaration.ts"
import type { EntityDecl } from "../../declarations/EntityDecl.ts"
import type { GetReferences, GetReferencesSerialized, Node, Serializer } from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import type { Validator } from "../../validation/type.ts"
import type {
  MemberDecl,
  ObjectType,
  SerializedMemberDecl,
  SerializedObjectType,
} from "../generic/ObjectType.ts"
import {
  getNestedDeclarationsInObjectType,
  getReferencesForObjectType,
  getReferencesForSerializedObjectType,
  resolveTypeArgumentsInObjectType,
  resolveTypeArgumentsInSerializedObjectType,
  serializeObjectType,
  validateObjectType,
} from "../generic/ObjectType.ts"
import type {
  BaseType,
  SerializedBaseType,
  SerializedType,
  StructureFormatter,
  Type,
} from "../Type.ts"
import { formatValue, removeParentKey, setParent } from "../Type.ts"

type TConstraint = Record<string, MemberDecl>

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

type TSerializedConstraint = Record<string, SerializedMemberDecl>

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
    type: Lazy.of(() => setParent(options.type, nestedEntityMapType)),
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
    type: Lazy.of(() => setParent(options.type(), nestedEntityMapType)),
  }

  return nestedEntityMapType
}

export const isNestedEntityMapType = (node: Node): node is NestedEntityMapType =>
  node.kind === NodeKind.NestedEntityMapType

export const getNestedDeclarationsInNestedEntityMapType: GetNestedDeclarations<
  NestedEntityMapType
> = (addedDecls, type) =>
  getNestedDeclarationsInObjectType(
    addedDecls.includes(type.secondaryEntity) ? addedDecls : [type.secondaryEntity, ...addedDecls],
    type.type.value,
  )

export const validateNestedEntityMapType: Validator<NestedEntityMapType> = (
  helpers,
  type,
  value,
) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`expected an object, but got ${json(value, helpers.useStyling)}`)]
  }

  return parallelizeErrors(
    Object.keys(value).map(key =>
      wrapErrorsIfAny(
        `at nested entity map ${entity(`"${type.name}"`, helpers.useStyling)} at key ${keyColor(`"${key}"`, helpers.useStyling)}`,
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

export const resolveTypeArgumentsInSerializedNestedEntityMapType = (
  args: Record<string, SerializedType>,
  type: SerializedNestedEntityMapType,
  decls: Record<string, SerializedDecl>,
): SerializedNestedEntityMapType => ({
  ...type,
  type: resolveTypeArgumentsInSerializedObjectType(args, type.type, decls),
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

export const getReferencesForSerializedNestedEntityMapType: GetReferencesSerialized<
  SerializedNestedEntityMapType
> = (type, value, decls) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? Object.values(value)
        .flatMap(item => getReferencesForSerializedObjectType(type.type, item, decls))
        .concat(Object.keys(value))
    : []

export const formatNestedEntityMapValue: StructureFormatter<NestedEntityMapType> = (type, value) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? sortObjectKeysAlphabetically(
        Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, formatValue(type.type.value, item)]),
        ),
      )
    : value
