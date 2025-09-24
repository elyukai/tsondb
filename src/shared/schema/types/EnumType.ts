import type { NodeKind } from "../Node.ts"
import type { SerializedBaseType, SerializedType } from "./Type.ts"

export interface SerializedEnumType<
  T extends Record<string, SerializedEnumCaseDecl> = Record<string, SerializedEnumCaseDecl>,
> extends SerializedBaseType {
  kind: NodeKind["EnumType"]
  values: T
}

export interface SerializedEnumCaseDecl<T extends SerializedType | null = SerializedType | null> {
  kind: NodeKind["EnumCaseDecl"]
  type: T
  comment?: string
  isDeprecated?: boolean
}
