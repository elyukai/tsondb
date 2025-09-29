import type { FunctionalComponent } from "preact"
import { parseBlockMarkdownForSyntaxHighlighting } from "../../shared/utils/markdown.ts"
import { BlockMarkdownHighlighting } from "./BlockMarkdownHighlighting.tsx"

type Props = {
  class?: string
  string: string
}

export const MarkdownHighlighting: FunctionalComponent<Props> = ({ class: className, string }) => {
  const blocks = parseBlockMarkdownForSyntaxHighlighting(string)
  const blockElements = blocks.map((block, i) => (
    <BlockMarkdownHighlighting key={`md-block-${i.toString()}`} node={block} />
  ))

  if (className) {
    return <div class={className}>{blockElements}</div>
  }

  return <>{blockElements}</>
}
