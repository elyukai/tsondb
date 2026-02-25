import { parseBlockMarkdown } from "@elyukai/markdown"
import type { FunctionalComponent } from "preact"
import { BlockMarkdown } from "./BlockMarkdown.tsx"

type Props = {
  class?: string
  string: string
  outerHeadingLevel?: number
  footnoteLabelSuffix?: string
}

export const Markdown: FunctionalComponent<Props> = ({
  class: className,
  string,
  outerHeadingLevel,
  footnoteLabelSuffix,
}) => {
  const blocks = parseBlockMarkdown(string)
  const blockElements = blocks.map((block, i) => (
    <BlockMarkdown
      key={`md-block-${i.toString()}`}
      node={block}
      outerHeadingLevel={outerHeadingLevel}
      footnoteLabelSuffix={footnoteLabelSuffix}
    />
  ))

  if (className) {
    return <div class={className}>{blockElements}</div>
  }

  return <>{blockElements}</>
}
