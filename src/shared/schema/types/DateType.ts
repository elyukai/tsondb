import type { DateConstraints } from "../../validation/date.ts"
import type { GetReferencesSerialized, NodeKind } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedDateType extends SerializedBaseType, DateConstraints {
  kind: NodeKind["DateType"]
}

export const getReferencesForSerializedDateType: GetReferencesSerialized<
  SerializedDateType
> = () => []
