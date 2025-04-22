import { FunctionalComponent } from "preact"

type Props = {
  string: string
}

const bold = /\*\*(.+?)\*\*/
const italic = /\*(.+?)\*/
const boldItalic = /\*\*\*(.+?)\*\*\*/

type TextNode = {
  kind: "text"
  content: string
}

type InlineMarkdownNode =
  | {
      kind: "bold" | "italic" | "boldItalic"
      content: InlineMarkdownNode[]
    }
  | TextNode

type BlockMarkdownNode =
  | {
      kind: "paragraph"
      content: InlineMarkdownNode[]
    }
  | TextNode

const parseBlockMarkdown = (text: string): BlockMarkdownNode[] =>
  text.split(/\n{2,}/).map(par => ({ kind: "paragraph", content: parseInlineMarkdown(par) }))

type InlinePatternKind = "bold" | "italic" | "boldItalic"

const parseForPattern = (
  pattern: RegExp,
  kind: InlinePatternKind,
  text: string,
  nextPatterns: [InlinePatternKind, RegExp][] = [],
): InlineMarkdownNode[] => {
  const res = pattern.exec(text)
  if (res) {
    const { index } = res
    const before = text.slice(0, index)
    const after = text.slice(index + res[0].length)
    const inner = res[1]!
    const innerNode =
      nextPatterns.length > 0
        ? parseForPattern(nextPatterns[0]![1], nextPatterns[0]![0], inner, nextPatterns.slice(1))
        : [{ kind, content: [{ kind: "text", content: inner } as const] }]
    return [
      ...(before.length > 0 ? [{ kind: "text", content: before } as const] : []),
      { kind, content: innerNode },
      ...(after.length > 0 ? parseForPattern(pattern, kind, after) : []),
    ]
  } else {
    return nextPatterns.length > 0
      ? parseForPattern(nextPatterns[0]![1], nextPatterns[0]![0], text, nextPatterns.slice(1))
      : [{ kind: "text", content: text }]
  }
}

const parseInlineMarkdown = (text: string): InlineMarkdownNode[] =>
  parseForPattern(boldItalic, "boldItalic", text, [
    ["bold", bold],
    ["italic", italic],
  ])

export const Markdown: FunctionalComponent<Props> = ({ string }) => {
  const blocks = parseBlockMarkdown(string)
  return blocks.map((block, i) => <BlockMarkdown key={`md-block-${i}`} node={block} />)
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
    case "boldItalic":
      return (
        <strong>
          <em>
            {node.content.map((inline, i) => (
              <InlineMarkdown node={inline} key={i} />
            ))}
          </em>
        </strong>
      )
    case "text":
      return node.content
  }
}
