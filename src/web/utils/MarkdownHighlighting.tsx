import {
  parseBlockMarkdownForSyntaxHighlighting,
  parseInlineMarkdownForSyntaxHighlighting,
} from "@elyukai/markdown"
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
    ? parseInlineMarkdownForSyntaxHighlighting(string)
    : parseBlockMarkdownForSyntaxHighlighting(string)
  const blockElements = blocks.map((block, i) => (
    <BlockMarkdownHighlighting key={`md-block-${i.toString()}`} node={block} />
  ))

  if (className) {
    return <div class={className}>{blockElements}</div>
  }

  return <>{blockElements}</>
}
