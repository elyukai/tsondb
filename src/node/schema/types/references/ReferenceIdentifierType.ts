import type { GetNestedDeclarations } from "../../declarations/Declaration.ts"
import { getNestedDeclarations } from "../../declarations/Declaration.ts"
import type { EntityDecl } from "../../declarations/EntityDecl.ts"
import { createEntityIdentifierType } from "../../declarations/EntityDecl.ts"
import type { GetReferences, GetReferencesSerialized, Node, Serializer } from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import type { Validator } from "../../validation/type.ts"
import type {
  BaseType,
  SerializedBaseType,
  SerializedType,
  StructureFormatter,
  Type,
} from "../Type.ts"
import { removeParentKey, validate } from "../Type.ts"

export interface ReferenceIdentifierType extends BaseType {
  kind: NodeKind["ReferenceIdentifierType"]
  entity: EntityDecl
}

export interface SerializedReferenceIdentifierType extends SerializedBaseType {
  kind: NodeKind["ReferenceIdentifierType"]
  entity: string
}

export const ReferenceIdentifierType = (entity: EntityDecl): ReferenceIdentifierType => ({
  kind: NodeKind.ReferenceIdentifierType,
  entity,
})

export { ReferenceIdentifierType as ReferenceIdentifier }

export const isReferenceIdentifierType = (node: Node): node is ReferenceIdentifierType =>
  node.kind === NodeKind.ReferenceIdentifierType

export const getNestedDeclarationsInReferenceIdentifierType: GetNestedDeclarations<
  ReferenceIdentifierType
> = (addedDecls, type) =>
  addedDecls.includes(type.entity)
    ? addedDecls
    : getNestedDeclarations([...addedDecls, type.entity], type.entity)

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

export const resolveTypeArgumentsInReferenceIdentifierType = (
  _args: Record<string, Type>,
  type: ReferenceIdentifierType,
): ReferenceIdentifierType => type

export const resolveTypeArgumentsInSerializedReferenceIdentifierType = (
  _args: Record<string, SerializedType>,
  type: SerializedReferenceIdentifierType,
): SerializedReferenceIdentifierType => type

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

export const getReferencesForSerializedReferenceIdentifierType: GetReferencesSerialized<
  SerializedReferenceIdentifierType
> = (_type, value) => (typeof value === "string" ? [value] : [])

export const formatReferenceIdentifierValue: StructureFormatter<ReferenceIdentifierType> = (
  _type,
  value,
) => value
