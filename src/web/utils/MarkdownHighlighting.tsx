import {
  parseBlockMarkdownForSyntaxHighlighting,
  parseInlineMarkdownForSyntaxHighlighting,
} from "@elyukai/markdown"
import { trySafe } from "@elyukai/utils/typeSafety"
import type { FunctionalComponent } from "preact"
import { BlockMarkdownHighlighting } from "./BlockMarkdownHighlighting.tsx"

type Props = {
  class?: string
  string: string
  inline?: boolean
}

export const MarkdownHighlighting: FunctionalComponent<Props> = ({
  class: className,
  string,
  inline,
}) => {
  const blocks = inline
    ? trySafe(
        () => parseInlineMarkdownForSyntaxHighlighting(string),
        [{ type: "text", content: string }],
      )
    : parseBlockMarkdownForSyntaxHighlighting(string)
  const blockElements = blocks.map((block, i) => (
    <BlockMarkdownHighlighting key={`md-block-${i.toString()}`} node={block} />
  ))

  if (className) {
    return <div class={className}>{blockElements}</div>
  }

  return <>{blockElements}</>
}
