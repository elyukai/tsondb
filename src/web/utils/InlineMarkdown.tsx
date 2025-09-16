import type { FunctionalComponent } from "preact"
import type { InlineMarkdownNode } from "../../shared/utils/markdown.ts"

type Props = {
  node: InlineMarkdownNode
}

export const InlineMarkdown: FunctionalComponent<Props> = ({ node }) => {
  switch (node.kind) {
    case "code":
      return <code>{node.content}</code>
    case "bold":
      return (
        <strong>
          {node.content.map((inline, i) => (
            <InlineMarkdown node={inline} key={i} />
          ))}
        </strong>
      )
    case "italic":
      return (
        <em>
          {node.content.map((inline, i) => (
            <InlineMarkdown node={inline} key={i} />
          ))}
        </em>
      )
    case "text":
      return node.content
  }
}
