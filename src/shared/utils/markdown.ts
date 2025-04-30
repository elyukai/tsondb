type Rule = {
  pattern: RegExp
  predicate?: (result: RegExpExecArray) => boolean
  map: (
    result: RegExpExecArray,
    parseInside: (text: string) => InlineMarkdownNode[],
  ) => InlineMarkdownNode
}

const boldWithItalicRule: Rule = {
  pattern: /\*\*(.*?\*.+?\*.*?)\*\*/,
  map: (result, parseInside) => ({ kind: "bold", content: parseInside(result[1]!) }),
}

const italicWithBoldRule: Rule = {
  pattern: /\*(.*?\*\*.+?\*\*.*?)\*/,
  map: (result, parseInside) => ({ kind: "italic", content: parseInside(result[1]!) }),
}

const boldRule: Rule = {
  pattern: /\*\*(.+?)\*\*/,
  map: (result, parseInside) => ({ kind: "bold", content: parseInside(result[1]!) }),
}

const italicRule: Rule = {
  pattern: /\*(.+?)\*/,
  map: (result, parseInside) => ({ kind: "italic", content: parseInside(result[1]!) }),
}

const rules: Rule[] = [boldWithItalicRule, italicWithBoldRule, boldRule, italicRule]

type TextNode = {
  kind: "text"
  content: string
}

export type InlineMarkdownNode =
  | {
      kind: "bold" | "italic"
      content: InlineMarkdownNode[]
    }
  | TextNode

export type BlockMarkdownNode =
  | {
      kind: "paragraph"
      content: InlineMarkdownNode[]
    }
  | TextNode

export const parseBlockMarkdown = (text: string): BlockMarkdownNode[] =>
  text.split(/\n{2,}/).map(par => ({ kind: "paragraph", content: parseInlineMarkdown(par) }))

const parseForRules = (rules: Rule[], text: string): InlineMarkdownNode[] => {
  if (text.length === 0) {
    return []
  }

  if (rules.length === 0) {
    return [{ kind: "text", content: text }]
  }

  const activeRule = rules[0]!
  const res = activeRule.pattern.exec(text)
  if (res && (activeRule.predicate?.(res) ?? true)) {
    const { index } = res
    const before = text.slice(0, index)
    const after = text.slice(index + res[0].length)
    return [
      ...(before.length > 0 ? parseForRules(rules.slice(1), before) : []),
      activeRule.map(res, text => parseForRules(rules.slice(1), text)),
      ...(after.length > 0 ? parseForRules(rules, after) : []),
    ]
  } else {
    return parseForRules(rules.slice(1), text)
  }
}

const parseInlineMarkdown = (text: string): InlineMarkdownNode[] => parseForRules(rules, text)
