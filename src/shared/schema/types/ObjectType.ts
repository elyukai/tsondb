import type { ObjectConstraints } from "../../validation/object.ts"
import {
  getReferencesSerialized,
  NodeKind,
  resolveSerializedTypeArguments,
  type GetReferencesSerialized,
  type SerializedNode,
  type SerializedTypeArgumentsResolver,
} from "../Node.ts"
import type { SerializedBaseType, SerializedType } from "./Type.ts"

type TSerializedConstraint = Record<string, SerializedMemberDecl>

export interface SerializedObjectType<T extends TSerializedConstraint = TSerializedConstraint>
  extends SerializedBaseType,
    ObjectConstraints {
  kind: NodeKind["ObjectType"]
  properties: T
}

export interface SerializedMemberDecl<
  T extends SerializedType = SerializedType,
  R extends boolean = boolean,
> {
  kind: NodeKind["MemberDecl"]
  isRequired: R
  type: T

  /**
   * Changes the appearance of the member’s name in editor forms.
   */
  displayName?: string
  comment?: string
  isDeprecated?: boolean
}

export const isSerializedObjectType = (type: SerializedNode): type is SerializedObjectType =>
  type.kind === NodeKind.ObjectType

export const resolveTypeArgumentsInSerializedObjectType: SerializedTypeArgumentsResolver<
  SerializedObjectType
> = (decls, args, type) => ({
  ...type,
  properties: Object.fromEntries(
    Object.entries(type.properties).map(
      ([key, config]) =>
        [
          key,
          { ...config, type: resolveSerializedTypeArguments(decls, args, config.type) },
        ] as const,
    ),
  ),
})

export const getReferencesForSerializedObjectType: GetReferencesSerialized<SerializedObjectType> = (
  decls,
  type,
  value,
) =>
  typeof value === "object" && value !== null
    ? Object.entries(value).flatMap(([key, propValue]) =>
        type.properties[key]
          ? getReferencesSerialized(decls, type.properties[key].type, propValue)
          : [],
      )
    : []
