type InlineRule = {
  pattern: RegExp
  predicate?: (result: RegExpExecArray) => boolean
  map: (
    result: RegExpExecArray,
    parseInside: (text: string) => InlineMarkdownNode[],
  ) => InlineMarkdownNode
}

const codeRule: InlineRule = {
  pattern: /`(.*?)`/,
  map: result => ({ kind: "code", content: result[1] ?? "" }),
}

const boldWithItalicRule: InlineRule = {
  pattern: /\*\*(.*?\*.+?\*.*?)\*\*/,
  map: (result, parseInside) => ({ kind: "bold", content: parseInside(result[1] ?? "") }),
}

const italicWithBoldRule: InlineRule = {
  pattern: /\*(.*?\*\*.+?\*\*.*?)\*/,
  map: (result, parseInside) => ({ kind: "italic", content: parseInside(result[1] ?? "") }),
}

const boldRule: InlineRule = {
  pattern: /\*\*(.+?)\*\*/,
  map: (result, parseInside) => ({ kind: "bold", content: parseInside(result[1] ?? "") }),
}

const italicRule: InlineRule = {
  pattern: /\*(.+?)\*/,
  map: (result, parseInside) => ({ kind: "italic", content: parseInside(result[1] ?? "") }),
}

const inlineRules: InlineRule[] = [
  codeRule,
  boldWithItalicRule,
  italicWithBoldRule,
  boldRule,
  italicRule,
]

type TextNode = {
  kind: "text"
  content: string
}

export type InlineMarkdownNode =
  | {
      kind: "bold" | "italic"
      content: InlineMarkdownNode[]
    }
  | {
      kind: "code"
      content: string
    }
  | TextNode

const parseForInlineRules = (rules: InlineRule[], text: string): InlineMarkdownNode[] => {
  if (text.length === 0) {
    return []
  }

  const activeRule = rules[0]

  if (activeRule === undefined) {
    return [{ kind: "text", content: text }]
  }

  const res = activeRule.pattern.exec(text)
  if (res && (activeRule.predicate?.(res) ?? true)) {
    const { index } = res
    const before = text.slice(0, index)
    const after = text.slice(index + res[0].length)
    return [
      ...(before.length > 0 ? parseForInlineRules(rules.slice(1), before) : []),
      activeRule.map(res, text => parseForInlineRules(rules.slice(1), text)),
      ...(after.length > 0 ? parseForInlineRules(rules, after) : []),
    ]
  } else {
    return parseForInlineRules(rules.slice(1), text)
  }
}

const parseInlineMarkdown = (text: string): InlineMarkdownNode[] =>
  parseForInlineRules(inlineRules, text)

type BlockRule = {
  pattern: RegExp
  predicate?: (result: RegExpExecArray) => boolean
  map: (result: RegExpExecArray) => BlockMarkdownNode
}

const listRule: BlockRule = {
  pattern: /^((?:(?:\d+\.|[-*]) [^\n]+?)(?:\n(?:\d+\.|[-*]) [^\n]+?)*)(?:\n{2,}|$)/,
  map: result => ({
    kind: "list",
    ordered: /^\d+\. /.test(result[0]),
    content: (result[1] ?? "").split("\n").map(item => ({
      kind: "listitem",
      content: parseInlineMarkdown(item.replace(/^\d+\. |[-*] /, "")),
    })),
  }),
}

const paragraphRule: BlockRule = {
  pattern: /^((?:[^\n]+?)(?:\n[^\n]+?)*)(?:\n{2,}|$)/,
  map: result => ({ kind: "paragraph", content: parseInlineMarkdown(result[1] ?? "") }),
}

const blockRules: BlockRule[] = [listRule, paragraphRule]

export type BlockMarkdownNode =
  | {
      kind: "paragraph"
      content: InlineMarkdownNode[]
    }
  | {
      kind: "list"
      ordered: boolean
      content: {
        kind: "listitem"
        content: InlineMarkdownNode[]
      }[]
    }
  | TextNode

const parseForBlockRules = (
  rules: BlockRule[],
  text: string,
  remainingRules: BlockRule[] = rules,
): BlockMarkdownNode[] => {
  if (text.length === 0) {
    return []
  }

  const activeRule = remainingRules[0]

  if (activeRule === undefined) {
    return [{ kind: "paragraph", content: [{ kind: "text", content: text }] }]
  }

  const res = activeRule.pattern.exec(text)

  if (res && (activeRule.predicate?.(res) ?? true)) {
    const { index } = res
    const after = text.slice(index + res[0].length)
    return [activeRule.map(res), ...(after.length > 0 ? parseForBlockRules(rules, after) : [])]
  } else {
    return parseForBlockRules(rules, text, remainingRules.slice(1))
  }
}

export const parseBlockMarkdown = (text: string): BlockMarkdownNode[] =>
  parseForBlockRules(blockRules, text)
