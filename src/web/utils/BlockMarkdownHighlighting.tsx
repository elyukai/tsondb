import type { FunctionalComponent } from "preact"
import type { BlockSyntaxMarkdownNode } from "../../shared/utils/markdown.ts"
import { InlineMarkdown } from "./InlineMarkdown.tsx"

type Props = {
  node: BlockSyntaxMarkdownNode
}

export const BlockMarkdownHighlighting: FunctionalComponent<Props> = ({ node }) => {
  switch (node.kind) {
    case "listitemmarker":
      return <span class="list-item-marker">{node.content}</span>
    case "tablemarker":
      return <span class="table-marker">{node.content}</span>
    default:
      return <InlineMarkdown node={node} />
  }
}
