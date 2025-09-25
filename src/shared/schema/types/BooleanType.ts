import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedBooleanType extends SerializedBaseType {
  kind: NodeKind["BooleanType"]
}

export const resolveTypeArgumentsInSerializedBooleanType: SerializedTypeArgumentsResolver<
  SerializedBooleanType
> = (_decls, _args, type) => type

export const getReferencesForSerializedBooleanType: GetReferencesSerialized<
  SerializedBooleanType
> = () => []
