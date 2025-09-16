import type { FunctionalComponent } from "preact"
import type { BlockMarkdownNode } from "../../shared/utils/markdown.ts"
import { InlineMarkdown } from "./InlineMarkdown.tsx"

type Props = {
  node: BlockMarkdownNode
}

export const BlockMarkdown: FunctionalComponent<Props> = ({ node }) => {
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
    default:
      return null
  }
}
