import { GetNestedDeclarations, getNestedDeclarations } from "../../declarations/Declaration.js"
import { createEntityIdentifierType, EntityDecl } from "../../declarations/EntityDecl.js"
import { GetReferences, Node, NodeKind, Serializer } from "../../Node.js"
import { Validator } from "../../validation/type.js"
import { MemberDecl, ObjectType } from "../generic/ObjectType.js"
import { BaseType, removeParentKey, SerializedBaseType, Type, validate } from "../Type.js"

type TConstraint = Record<string, MemberDecl<Type, boolean>>

export interface ReferenceIdentifierType<
  Name extends string = string,
  T extends TConstraint = TConstraint,
> extends BaseType {
  kind: NodeKind["ReferenceIdentifierType"]
  entity: EntityDecl<Name, ObjectType<T>>
}

export interface SerializedReferenceIdentifierType extends SerializedBaseType {
  kind: NodeKind["ReferenceIdentifierType"]
  entity: string
}

export const ReferenceIdentifierType = <Name extends string, T extends TConstraint>(
  entity: EntityDecl<Name, ObjectType<T>>,
): ReferenceIdentifierType<Name, T> => ({
  kind: NodeKind.ReferenceIdentifierType,
  entity,
})

export { ReferenceIdentifierType as ReferenceIdentifier }

export const isReferenceIdentifierType = (node: Node): node is ReferenceIdentifierType =>
  node.kind === NodeKind.ReferenceIdentifierType

export const getNestedDeclarationsInReferenceIdentifierType: GetNestedDeclarations<
  ReferenceIdentifierType
> = (isDeclAdded, type) => [type.entity, ...getNestedDeclarations(isDeclAdded, type.entity)]

export const validateReferenceIdentifierType: Validator<ReferenceIdentifierType> = (
  helpers,
  type,
  value,
) =>
  validate(helpers, createEntityIdentifierType(), value).concat(
    helpers.checkReferentialIntegrity({
      name: type.entity.name,
      value: value,
    }),
  )

export const resolveTypeArgumentsInReferenceIdentifierType = <
  Name extends string,
  T extends TConstraint,
  Args extends Record<string, Type>,
>(
  _args: Args,
  type: ReferenceIdentifierType<Name, T>,
): ReferenceIdentifierType<Name, T> => type

export const serializeReferenceIdentifierType: Serializer<
  ReferenceIdentifierType,
  SerializedReferenceIdentifierType
> = type => ({
  ...removeParentKey(type),
  entity: type.entity.name,
})

export const getReferencesForReferenceIdentifierType: GetReferences<ReferenceIdentifierType> = (
  _type,
  value,
) => (typeof value === "string" ? [value] : [])
