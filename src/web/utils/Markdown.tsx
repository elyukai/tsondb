import type { FunctionalComponent } from "preact"
import { parseBlockMarkdown } from "../../shared/utils/markdown.ts"
import { BlockMarkdown } from "./BlockMarkdown.tsx"

type Props = {
  class?: string
  string: string
  outerHeadingLevel?: number
}

export const Markdown: FunctionalComponent<Props> = ({
  class: className,
  string,
  outerHeadingLevel,
}) => {
  const blocks = parseBlockMarkdown(string)
  const blockElements = blocks.map((block, i) => (
    <BlockMarkdown
      key={`md-block-${i.toString()}`}
      node={block}
      outerHeadingLevel={outerHeadingLevel}
    />
  ))

  if (className) {
    return <div class={className}>{blockElements}</div>
  }

  return <>{blockElements}</>
}
