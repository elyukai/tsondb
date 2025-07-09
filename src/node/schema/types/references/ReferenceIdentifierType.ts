import type { GetNestedDeclarations } from "../../declarations/Declaration.js"
import { getNestedDeclarations } from "../../declarations/Declaration.js"
import type { EntityDecl } from "../../declarations/EntityDecl.js"
import { createEntityIdentifierType } from "../../declarations/EntityDecl.js"
import type { GetReferences, Node, Serializer } from "../../Node.js"
import { NodeKind } from "../../Node.js"
import type { Validator } from "../../validation/type.js"
import type { BaseType, SerializedBaseType, StructureFormatter, Type } from "../Type.js"
import { removeParentKey, validate } from "../Type.js"

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

export const formatReferenceIdentifierValue: StructureFormatter<ReferenceIdentifierType> = (
  _type,
  value,
) => value
