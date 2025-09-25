import type { NodeKind } from "../Node.ts"
import {
  resolveSerializedTypeArguments,
  type GetReferencesSerialized,
  type SerializedTypeArgumentsResolver,
} from "../Node.ts"
import {
  getReferencesForSerializedIncludeIdentifierType,
  type SerializedIncludeIdentifierType,
} from "./IncludeIdentifierType.ts"
import {
  getReferencesForSerializedObjectType,
  isSerializedObjectType,
  type SerializedMemberDecl,
  type SerializedObjectType,
} from "./ObjectType.ts"
import type { SerializedBaseType } from "./Type.ts"

type TSerializedConstraint = Record<string, SerializedMemberDecl>

type PossibleType<T extends TSerializedConstraint> =
  | SerializedObjectType<T>
  | SerializedIncludeIdentifierType<[]>

export interface SerializedNestedEntityMapType<
  Name extends string = string,
  T extends TSerializedConstraint = TSerializedConstraint,
> extends SerializedBaseType {
  kind: NodeKind["NestedEntityMapType"]
  name: Name
  comment?: string
  secondaryEntity: string
  type: PossibleType<T>
}

export const resolveTypeArgumentsInSerializedNestedEntityMapType: SerializedTypeArgumentsResolver<
  SerializedNestedEntityMapType
> = (decls, args, type) => ({
  ...type,
  type: resolveSerializedTypeArguments(decls, args, type.type),
})

export const getReferencesForSerializedNestedEntityMapType: GetReferencesSerialized<
  SerializedNestedEntityMapType
> = (decls, type, value) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? Object.values(value)
        .flatMap(item =>
          isSerializedObjectType(type.type)
            ? getReferencesForSerializedObjectType(decls, type.type, item)
            : getReferencesForSerializedIncludeIdentifierType(decls, type.type, item),
        )
        .concat(Object.keys(value))
    : []
