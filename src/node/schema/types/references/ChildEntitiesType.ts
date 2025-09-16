import type { GetNestedDeclarations } from "../../declarations/Declaration.ts"
import { getNestedDeclarations } from "../../declarations/Declaration.ts"
import { createEntityIdentifierType, type EntityDecl } from "../../declarations/EntityDecl.ts"
import type { GetReferences, Node, Serializer } from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import type { Validator } from "../../validation/type.ts"
import { ArrayType } from "../generic/ArrayType.ts"
import type { MemberDecl } from "../generic/ObjectType.ts"
import type { BaseType, SerializedBaseType, StructureFormatter, Type } from "../Type.ts"
import { removeParentKey, validate } from "../Type.ts"
import type { ReferenceIdentifier } from "./ReferenceIdentifierType.ts"

type OnlyReferenceMemberKeys<O extends Record<string, MemberDecl>> = {
  [K in keyof O]: O[K] extends MemberDecl<ReferenceIdentifier, true> ? K : never
}[keyof O]

type ReferenceMemberKeysFromEntity<E extends EntityDecl> =
  E extends EntityDecl<string, infer O> ? OnlyReferenceMemberKeys<O["properties"]> : never

export interface ChildEntitiesType<
  T extends EntityDecl = EntityDecl,
  P extends ReferenceMemberKeysFromEntity<T> = ReferenceMemberKeysFromEntity<T>,
> extends BaseType {
  kind: NodeKind["ChildEntitiesType"]
  entity: T
  parentReferencePath: P
}

export interface SerializedChildEntitiesType extends SerializedBaseType {
  kind: NodeKind["ChildEntitiesType"]
  entity: string
  parentReferencePath: string
}

export const ChildEntitiesType = <
  T extends EntityDecl,
  P extends ReferenceMemberKeysFromEntity<T>,
>(options: {
  entity: T
  parentReferencePath: P
}): ChildEntitiesType<T, P> => ({
  ...options,
  kind: NodeKind.ChildEntitiesType,
})

export { ChildEntitiesType as ChildEntities }

export const isChildEntitiesType = (node: Node): node is ChildEntitiesType =>
  node.kind === NodeKind.ChildEntitiesType

export const getNestedDeclarationsInChildEntitiesType: GetNestedDeclarations<ChildEntitiesType> = (
  addedDecls,
  type,
) => getNestedDeclarations([type.entity, ...addedDecls], type.entity)

export const validateChildEntitiesType: Validator<ChildEntitiesType> = (helpers, type, value) =>
  validate(helpers, ArrayType(createEntityIdentifierType(), { uniqueItems: true }), value).concat(
    Array.isArray(value) && value.every(id => typeof id === "string")
      ? value.flatMap(id =>
          helpers.checkReferentialIntegrity({
            name: type.entity.name,
            value: id,
          }),
        )
      : [],
  )

export const resolveTypeArgumentsInChildEntitiesType = (
  _args: Record<string, Type>,
  type: ChildEntitiesType,
): Type => type

export const serializeChildEntitiesType: Serializer<
  ChildEntitiesType,
  SerializedChildEntitiesType
> = type => ({
  ...removeParentKey(type),
  entity: type.entity.name,
  parentReferencePath: type.parentReferencePath,
})

export const getReferencesForChildEntitiesType: GetReferences<ChildEntitiesType> = (
  _type,
  value,
) => (Array.isArray(value) && value.every(id => typeof id === "string") ? value : [])

export const formatChildEntitiesValue: StructureFormatter<ChildEntitiesType> = (_type, value) =>
  Array.isArray(value) ? value.toSorted() : value
