import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedChildEntitiesType extends SerializedBaseType {
  kind: NodeKind["ChildEntitiesType"]
  entity: string
}

export const resolveTypeArgumentsInSerializedChildEntitiesType: SerializedTypeArgumentsResolver<
  SerializedChildEntitiesType
> = (_decls, _args, type) => type

export const getReferencesForSerializedChildEntitiesType: GetReferencesSerialized<
  SerializedChildEntitiesType
> = () => []
