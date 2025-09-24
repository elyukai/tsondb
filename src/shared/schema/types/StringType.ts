import type { StringConstraints } from "../../validation/string.ts"
import type { GetReferencesSerialized, NodeKind } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedStringType extends SerializedBaseType, StringConstraints {
  kind: NodeKind["StringType"]
  pattern?: string
  isMarkdown?: boolean
}

export const getReferencesForSerializedStringType: GetReferencesSerialized<
  SerializedStringType
> = () => []
