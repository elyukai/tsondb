import { type EntityDecl } from "../../declarations/EntityDecl.ts"
import {
  type GetNestedDeclarations,
  type GetReferences,
  type Predicate,
  type Serializer,
  type TypeArgumentsResolver,
  type Validator,
} from "../../Node.js"
import { getNestedDeclarations, NodeKind } from "../../Node.ts"
import type { MemberDecl } from "../generic/ObjectType.ts"
import type { BaseType, StructureFormatter } from "../Type.ts"

export interface ChildEntitiesType<
  T extends EntityDecl<string, Record<string, MemberDecl>, string> = EntityDecl<
    string,
    Record<string, MemberDecl>,
    string
  >,
> extends BaseType {
  kind: NodeKind["ChildEntitiesType"]
  entity: T
}

export const ChildEntitiesType = <T extends EntityDecl<string, Record<string, MemberDecl>, string>>(
  entity: T,
): ChildEntitiesType<T> => ({
  kind: NodeKind.ChildEntitiesType,
  entity,
})

export { ChildEntitiesType as ChildEntities }

export const isChildEntitiesType: Predicate<ChildEntitiesType> = node =>
  node.kind === NodeKind.ChildEntitiesType

export const getNestedDeclarationsInChildEntitiesType: GetNestedDeclarations<ChildEntitiesType> = (
  addedDecls,
  type,
  parentDecl,
) => getNestedDeclarations(addedDecls, type.entity, parentDecl)

export const validateChildEntitiesType: Validator<ChildEntitiesType> = () => []

export const resolveTypeArgumentsInChildEntitiesType: TypeArgumentsResolver<ChildEntitiesType> = (
  _args,
  type,
) => type

export const serializeChildEntitiesType: Serializer<ChildEntitiesType> = type => ({
  ...type,
  entity: type.entity.name,
})

export const getReferencesForChildEntitiesType: GetReferences<ChildEntitiesType> = (
  _type,
  value,
) => (Array.isArray(value) && value.every(id => typeof id === "string") ? value : [])

export const formatChildEntitiesValue: StructureFormatter<ChildEntitiesType> = (_type, value) =>
  Array.isArray(value) ? value.toSorted() : value
