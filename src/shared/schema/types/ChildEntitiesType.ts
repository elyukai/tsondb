import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedChildEntitiesType extends SerializedBaseType {
  kind: NodeKind["ChildEntitiesType"]
  entity: string
  parentReferencePath: string
}

export const resolveTypeArgumentsInSerializedChildEntitiesType: SerializedTypeArgumentsResolver<
  SerializedChildEntitiesType
> = (_decls, _args, type) => type

export const getReferencesForSerializedChildEntitiesType: GetReferencesSerialized<
  SerializedChildEntitiesType
> = (_decls, _node, value) =>
  Array.isArray(value) && value.every(id => typeof id === "string") ? value : []
