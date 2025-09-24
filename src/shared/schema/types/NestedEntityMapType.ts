import type { NodeKind } from "../Node.ts"
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
