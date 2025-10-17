import { Fragment, type FunctionalComponent } from "preact"
import type { InlineMarkdownNode } from "../../shared/utils/markdown.ts"
import { assertExhaustive } from "../../shared/utils/typeSafety.ts"

type Props = {
  node: InlineMarkdownNode
}

const emptyNode: InlineMarkdownNode = { kind: "text", content: "" }

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
    case "link":
      return (
        <a href={node.href}>
          {node.content.map((inline, i) => (
            <InlineMarkdown node={inline} key={i} />
          ))}
        </a>
      )
    case "attributed": {
      const separatorIndex = node.content.findIndex(
        attr => attr.kind === "text" && attr.content === "](",
      )
      const count = Object.keys(node.attributes).length

      const attributesStart = separatorIndex + 1
      const attributesEnd = attributesStart + (count === 0 ? 0 : count * 4 - 1)

      const leadingNodes = node.content.slice(0, attributesStart)
      const attributes = node.content.slice(attributesStart, attributesEnd)
      const trailingNodes = node.content.slice(attributesEnd)

      return (
        <span
          class="attributed"
          {...Object.fromEntries(
            Object.entries(node.attributes).map(([k, v]) => [`data-${k}`, v.toString()]),
          )}
        >
          {leadingNodes.map((inline, i) => (
            <InlineMarkdown node={inline} key={i} />
          ))}
          {Array.from({ length: count }, (_, i) => (
            <Fragment key={`attr-${(i + 1).toString()}`}>
              <span class="attributed__name">
                <InlineMarkdown node={attributes[i * 4] ?? emptyNode} />
              </span>
              <span class="attributed__separator">
                <InlineMarkdown node={attributes[i * 4 + 1] ?? emptyNode} />
              </span>
              <span class="attributed__value">
                <InlineMarkdown node={attributes[i * 4 + 2] ?? emptyNode} />
              </span>
              {i < count - 1 && (
                <span class="attributed__separator">
                  <InlineMarkdown node={attributes[i * 4 + 3] ?? emptyNode} />
                </span>
              )}
            </Fragment>
          ))}
          {trailingNodes.map((inline, i) => (
            <InlineMarkdown node={inline} key={i} />
          ))}
        </span>
      )
    }
    case "superscript":
      return (
        <sup>
          {node.content.map((inline, i) => (
            <InlineMarkdown node={inline} key={i} />
          ))}
        </sup>
      )
    case "footnoteRef": {
      const isNumeric = /^\d+$/.test(node.label)
      return (
        <sup
          class={"footnote-ref" + (isNumeric ? " footnote-ref--numeric" : "")}
          data-reference={node.label}
          style={{ "--label": isNumeric ? Number.parseInt(node.label) : node.label }}
        >
          <span class="footnote-label">{node.label}</span>
        </sup>
      )
    }
    case "text":
      return node.content
    default:
      return assertExhaustive(node)
  }
}
