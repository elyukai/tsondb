import type { StringConstraints } from "../../validation/string.ts"
import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export interface SerializedStringType extends SerializedBaseType, StringConstraints {
  kind: NodeKind["StringType"]
  pattern?: string
  isMarkdown?: boolean
}

export const resolveTypeArgumentsInSerializedStringType: SerializedTypeArgumentsResolver<
  SerializedStringType
> = (_decls, _args, type) => type

export const getReferencesForSerializedStringType: GetReferencesSerialized<
  SerializedStringType
> = () => []
