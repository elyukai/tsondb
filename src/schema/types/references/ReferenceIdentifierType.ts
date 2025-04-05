import { Decl, getNestedDeclarations } from "../../declarations/Declaration.js"
import { EntityDecl } from "../../declarations/EntityDeclaration.js"
import { TypeParameter } from "../../parameters/TypeParameter.js"
import { ObjectType } from "../generic/ObjectType.js"
import { NodeKind } from "../Node.js"
import { Type } from "../Type.js"

type TConstraint = EntityDecl<string, ObjectType<any>, string, TypeParameter[]>

export interface ReferenceIdentifierType<T extends TConstraint> {
  kind: typeof NodeKind.ReferenceIdentifierType
  entity: T
}

export const ReferenceIdentifier = <T extends TConstraint>(
  entity: T,
): ReferenceIdentifierType<T> => ({
  kind: NodeKind.ReferenceIdentifierType,
  entity,
})

export const isReferenceIdentifierType = (
  type: Type,
): type is ReferenceIdentifierType<TConstraint> => type.kind === NodeKind.ReferenceIdentifierType

export const getNestedDeclarationsInReferenceIdentifierType = (
  type: ReferenceIdentifierType<TConstraint>,
): Decl[] => [type.entity, ...getNestedDeclarations(type.entity)]

export const validateReferenceIdentifierType = (
  _type: ReferenceIdentifierType<TConstraint>,
  _value: unknown,
): void => {}

export const replaceTypeArgumentsInReferenceIdentifierType = <
  T extends TConstraint,
  Args extends Record<string, Type>,
>(
  _args: Args,
  type: ReferenceIdentifierType<T>,
): ReferenceIdentifierType<T> => type
