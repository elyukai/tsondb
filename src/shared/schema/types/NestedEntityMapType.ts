import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedIncludeIdentifierType } from "./IncludeIdentifierType.ts"
import type { SerializedMemberDecl, SerializedObjectType } from "./ObjectType.ts"
import type { SerializedBaseType } from "./Type.ts"

type TSerializedConstraint = Record<string, SerializedMemberDecl>

export interface SerializedNestedEntityMapType<
  Name extends string = string,
  T extends TSerializedConstraint = TSerializedConstraint,
> extends SerializedBaseType {
  kind: NodeKind["NestedEntityMapType"]
  name: Name
  comment?: string
  secondaryEntity: string
  type: SerializedObjectType<T> | SerializedIncludeIdentifierType
}

export const resolveTypeArgumentsInSerializedNestedEntityMapType: SerializedTypeArgumentsResolver<
  SerializedNestedEntityMapType
> = (decls, args, type) => ({
  ...type,
  type: resolveTypeArgumentsInSerializedObjectType(decls, args, type.type),
})

export const getReferencesForSerializedNestedEntityMapType: GetReferencesSerialized<
  SerializedNestedEntityMapType
> = (decls, type, value) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? Object.values(value)
        .flatMap(item => getReferencesForSerializedObjectType(decls, type.type, item))
        .concat(Object.keys(value))
    : []
