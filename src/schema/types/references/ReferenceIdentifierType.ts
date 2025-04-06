import { Decl, getNestedDeclarations } from "../../declarations/Declaration.js"
import { EntityDecl } from "../../declarations/EntityDecl.js"
import { Node, NodeKind } from "../../Node.js"
import { TypeParameter } from "../../parameters/TypeParameter.js"
import { MemberDecl, ObjectType, RequiredProperties } from "../generic/ObjectType.js"
import { IntegerType } from "../primitives/IntegerType.js"
import { StringType } from "../primitives/StringType.js"
import { BaseType, Type, validate } from "../Type.js"

type TConstraint = Record<string, MemberDecl<Type, true>>

export interface ReferenceIdentifierType<T extends TConstraint = TConstraint> extends BaseType {
  kind: typeof NodeKind.ReferenceIdentifierType
  entity: EntityDecl<string, ObjectType<T>, RequiredProperties<T> & string, TypeParameter[]>
}

export const ReferenceIdentifier = <T extends TConstraint>(
  entity: EntityDecl<string, ObjectType<T>, RequiredProperties<T> & string, TypeParameter[]>,
): ReferenceIdentifierType<T> => ({
  kind: NodeKind.ReferenceIdentifierType,
  entity,
})

export const isReferenceIdentifierType = (node: Node): node is ReferenceIdentifierType =>
  node.kind === NodeKind.ReferenceIdentifierType

export const getNestedDeclarationsInReferenceIdentifierType = (
  type: ReferenceIdentifierType,
): Decl[] => [type.entity, ...getNestedDeclarations(type.entity)]

export const validateReferenceIdentifierType = (
  type: ReferenceIdentifierType,
  value: unknown,
): void => validate(type.entity.type.value, value)

export const replaceTypeArgumentsInReferenceIdentifierType = <
  T extends TConstraint,
  Args extends Record<string, Type>,
>(
  _args: Args,
  type: ReferenceIdentifierType<T>,
): ReferenceIdentifierType<T> => type

export type SimpleReferenceMemberDecl<K extends string, T extends Type> = MemberDecl<
  ReferenceIdentifierType<{ [Key in K]: MemberDecl<T, true> }>,
  true
>

export type SimpleIntegerIdentifierReferenceMemberDecl = SimpleReferenceMemberDecl<
  "id",
  IntegerType
>
export type SimpleStringIdentifierReferenceMemberDecl = SimpleReferenceMemberDecl<"id", StringType>
