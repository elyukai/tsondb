import { parseBlockMarkdown, parseInlineMarkdown } from "@elyukai/markdown"
import { trySafe } from "@elyukai/utils/typeSafety"
import type { FunctionalComponent } from "preact"
import { BlockMarkdown } from "./BlockMarkdown.tsx"
import { InlineMarkdown } from "./InlineMarkdown.tsx"

type Props = {
  class?: string
  string: string
  outerHeadingLevel?: number
  footnoteLabelSuffix?: string
  inline?: boolean
}

export const Markdown: FunctionalComponent<Props> = ({
  class: className,
  string,
  outerHeadingLevel,
  footnoteLabelSuffix,
  inline,
}) => {
  const elements = inline
    ? trySafe(() => parseInlineMarkdown(string), [{ type: "text", content: string }]).map(
        (node, i) => <InlineMarkdown key={`md-inline-${i.toString()}`} node={node} />,
      )
    : parseBlockMarkdown(string).map((node, i) => (
        <BlockMarkdown
          key={`md-block-${i.toString()}`}
          node={node}
          outerHeadingLevel={outerHeadingLevel}
          footnoteLabelSuffix={footnoteLabelSuffix}
        />
      ))

  if (className) {
    return <div class={className}>{elements}</div>
  }

  return <>{elements}</>
}
