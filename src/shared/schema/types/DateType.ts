import type { DateConstraints } from "../../validation/date.ts"
import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedDateType extends SerializedBaseType, DateConstraints {
  kind: NodeKind["DateType"]
}

export const resolveTypeArgumentsInSerializedDateType: SerializedTypeArgumentsResolver<
  SerializedDateType
> = (_decls, _args, type) => type

export const getReferencesForSerializedDateType: GetReferencesSerialized<
  SerializedDateType
> = () => []
