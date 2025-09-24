import type { DateConstraints } from "../../validation/date.ts"
import type { NodeKind } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedDateType extends SerializedBaseType, DateConstraints {
  kind: NodeKind["DateType"]
}
