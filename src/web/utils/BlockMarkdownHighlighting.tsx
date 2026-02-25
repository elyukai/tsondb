import type { BlockSyntaxMarkdownNode } from "@elyukai/markdown/types"
import type { FunctionalComponent } from "preact"
import { InlineMarkdown } from "./InlineMarkdown.tsx"

type Props = {
  node: BlockSyntaxMarkdownNode
}

export const BlockMarkdownHighlighting: FunctionalComponent<Props> = ({ node }) => {
  switch (node.kind) {
    case "listItemMarker":
      return <span class="list-item-marker">{node.content}</span>
    case "tableMarker":
      return <span class="table-marker">{node.content}</span>
    case "headingMarker":
      return <span class="heading-marker">{node.content}</span>
    case "sectionMarker":
      return <span class="section-marker">{node.content}</span>
    case "footnoteMarker":
      return <span class="footnote-marker">{node.content}</span>
    case "footnoteRef":
      return <span class="footnote-marker">{node.label}</span>
    case "definitionMarker":
      return <span class="definition-description-marker">{node.content}</span>
    default:
      return <InlineMarkdown node={node} />
  }
}
