import type { NodeKind } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedReferenceIdentifierType extends SerializedBaseType {
  kind: NodeKind["ReferenceIdentifierType"]
  entity: string
}
