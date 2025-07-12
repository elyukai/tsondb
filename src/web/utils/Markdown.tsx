import type { FunctionalComponent } from "preact"
import type { BlockMarkdownNode, InlineMarkdownNode } from "../../shared/utils/markdown.ts"
import { parseBlockMarkdown } from "../../shared/utils/markdown.ts"

type Props = {
  class?: string
  string: string
}

export const Markdown: FunctionalComponent<Props> = ({ class: className, string }) => {
  const blocks = parseBlockMarkdown(string)
  const blockElements = blocks.map((block, i) => (
    <BlockMarkdown key={`md-block-${i.toString()}`} node={block} />
  ))

  if (className) {
    return <div class={className}>{blockElements}</div>
  }

  return <>{blockElements}</>
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
    case "list":
      if (node.ordered) {
        return (
          <ol>
            {node.content.map((item, ii) => (
              <li key={ii}>
                {item.content.map((inline, iii) => (
                  <InlineMarkdown key={iii} node={inline} />
                ))}
              </li>
            ))}
          </ol>
        )
      } else {
        return (
          <ul>
            {node.content.map((item, ii) => (
              <li key={ii}>
                {item.content.map((inline, iii) => (
                  <InlineMarkdown key={iii} node={inline} />
                ))}
              </li>
            ))}
          </ul>
        )
      }
    case "text":
      return node.content
    default:
      return null
  }
}

const InlineMarkdown: FunctionalComponent<{ node: InlineMarkdownNode }> = ({ node }) => {
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
