import { NodeKind } from "../../../../shared/schema/Node.ts"
import type { Node } from "../index.ts"
import type { BaseType, Type } from "./Type.ts"

export interface EnumType<
  T extends Record<string, EnumCaseDecl> = Record<string, EnumCaseDecl>,
> extends BaseType {
  kind: NodeKind["EnumType"]
  values: T
}

export const EnumType = <T extends Record<string, EnumCaseDecl> = Record<string, EnumCaseDecl>>(
  values: T,
): EnumType<T> => ({
  kind: NodeKind.EnumType,
  values,
})

export const isEnumType = (node: Node): node is EnumType => node.kind === NodeKind.EnumType

export interface EnumCaseDecl<T extends Type | null = Type | null> {
  kind: NodeKind["EnumCaseDecl"]
  type: T

  /**
   * Changes the appearance of the enum case’s name in editor forms.
   */
  displayName?: string
  comment?: string
  isDeprecated?: boolean
}

export const EnumCaseDecl = <T extends Type | null>(options: {
  type: T

  /**
   * Changes the appearance of the enum case’s name in editor forms.
   */
  displayName?: string
  comment?: string
  isDeprecated?: boolean
}): EnumCaseDecl<T> => ({
  ...options,
  kind: NodeKind.EnumCaseDecl,
})

export { EnumCaseDecl as EnumCase }
