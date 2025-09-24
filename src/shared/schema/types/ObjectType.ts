import type { ObjectConstraints } from "../../validation/object.ts"
import type { NodeKind } from "../Node.ts"
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
  comment?: string
  isDeprecated?: boolean
}
