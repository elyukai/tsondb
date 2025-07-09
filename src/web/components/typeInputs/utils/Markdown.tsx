import type { FunctionalComponent } from "preact"
import type { BlockMarkdownNode, InlineMarkdownNode } from "../../../../shared/utils/markdown.js"
import { parseBlockMarkdown } from "../../../../shared/utils/markdown.js"

type Props = {
  string: string
}

export const Markdown: FunctionalComponent<Props> = ({ string }) => {
  const blocks = parseBlockMarkdown(string)
  return blocks.map((block, i) => <BlockMarkdown key={`md-block-${i.toString()}`} node={block} />)
}

const BlockMarkdown: FunctionalComponent<{ node: BlockMarkdownNode }> = ({ node }) => {
  switch (node.kind) {
    case "paragraph":
      return (
        <p>
          {node.content.map((inline, ii) => (
            <InlineMarkdown key={ii} node={inline} />
          ))}
        </p>
      )
    case "text":
      return node.content
    default:
      return null
  }
}

const InlineMarkdown: FunctionalComponent<{ node: InlineMarkdownNode }> = ({ node }) => {
  switch (node.kind) {
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
