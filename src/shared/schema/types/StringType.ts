import type { StringConstraints } from "../../validation/string.ts"
import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedBaseType } from "./Type.ts"

export type MarkdownStringOption = "block" | "inline"

export interface SerializedStringType extends SerializedBaseType, StringConstraints {
  kind: NodeKind["StringType"]
  pattern?: string
  markdown?: MarkdownStringOption
}

export const resolveTypeArgumentsInSerializedStringType: SerializedTypeArgumentsResolver<
  SerializedStringType
> = (_decls, _args, type) => type

export const getReferencesForSerializedStringType: GetReferencesSerialized<
  SerializedStringType
> = () => []
