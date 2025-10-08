import type { EntityDecl } from "../../declarations/EntityDecl.ts"
import { createEntityIdentifierType } from "../../declarations/EntityDecl.ts"
import type {
  GetNestedDeclarations,
  GetReferences,
  Node,
  Serializer,
  TypeArgumentsResolver,
  Validator,
} from "../../Node.ts"
import { getNestedDeclarations, NodeKind, validateType } from "../../Node.ts"
import type { BaseType, StructureFormatter } from "../Type.ts"

export interface ReferenceIdentifierType extends BaseType {
  kind: NodeKind["ReferenceIdentifierType"]
  entity: EntityDecl
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
> = (addedDecls, type, parentDecl) =>
  addedDecls.includes(type.entity)
    ? addedDecls
    : getNestedDeclarations(addedDecls, type.entity, parentDecl)

export const validateReferenceIdentifierType: Validator<ReferenceIdentifierType> = (
  helpers,
  type,
  value,
) =>
  validateType(helpers, createEntityIdentifierType(), value).concat(
    helpers.checkReferentialIntegrity({
      name: type.entity.name,
      value: value,
    }),
  )

export const resolveTypeArgumentsInReferenceIdentifierType: TypeArgumentsResolver<
  ReferenceIdentifierType
> = (_args, type) => type

export const serializeReferenceIdentifierType: Serializer<ReferenceIdentifierType> = type => ({
  ...type,
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
