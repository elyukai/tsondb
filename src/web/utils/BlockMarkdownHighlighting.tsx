import type { BlockMarkdownSyntaxNode } from "@elyukai/markdown"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { FunctionalComponent } from "preact"
import { InlineMarkdown } from "./InlineMarkdown.tsx"

type Props = {
  node: BlockMarkdownSyntaxNode
}

export const BlockMarkdownHighlighting: FunctionalComponent<Props> = ({ node }) => {
  if (node.type === "syntax") {
    switch (node.blockType) {
      case "heading":
        return <span class="heading-marker">{node.content}</span>
      case "footnote":
        return <span class="footnote-marker">{node.content}</span>
      case "container":
        return <span class="section-marker">{node.content}</span>
      case "definitionList":
        return <span class="definition-description-marker">{node.content}</span>
      case "unorderedList":
      case "orderedList":
        return <span class="list-item-marker">{node.content}</span>
      case "table":
        return <span class="table-marker">{node.content}</span>
      default:
        return assertExhaustive(node.blockType)
    }
  } else {
    return <InlineMarkdown node={node} />
  }
}
