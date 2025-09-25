import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedReferenceIdentifierType extends SerializedBaseType {
  kind: NodeKind["ReferenceIdentifierType"]
  entity: string
}

export const resolveTypeArgumentsInSerializedReferenceIdentifierType: SerializedTypeArgumentsResolver<
  SerializedReferenceIdentifierType
> = (_decls, _args, type) => type

export const getReferencesForSerializedReferenceIdentifierType: GetReferencesSerialized<
  SerializedReferenceIdentifierType
> = (_decls, _type, value) => (typeof value === "string" ? [value] : [])
