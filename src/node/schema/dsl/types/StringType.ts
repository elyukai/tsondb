import { NodeKind } from "../../../../shared/schema/Node.js"
import type { MarkdownStringOption } from "../../../../shared/schema/types/StringType.ts"
import type { StringConstraints } from "../../../../shared/validation/string.ts"
import type { Node } from "../index.ts"
import type { BaseType } from "./Type.ts"

export interface StringType extends BaseType, StringConstraints {
  kind: NodeKind["StringType"]
  pattern?: RegExp
  markdown?: MarkdownStringOption
}
export const StringType = (
  options: {
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    markdown?: MarkdownStringOption
  } = {},
): StringType => ({
  ...options,
  kind: NodeKind.StringType,
})

export { StringType as String }

export const isStringType = (node: Node): node is StringType => node.kind === NodeKind.StringType
