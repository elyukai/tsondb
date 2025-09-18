type InlineRule = {
  pattern: RegExp
  predicate?: (result: RegExpExecArray) => boolean
  map: (
    result: RegExpExecArray,
    parseInside: (text: string) => InlineMarkdownNode[],
  ) => InlineMarkdownNode
  mapHighlighting: (
    result: RegExpExecArray,
    parseInside: (text: string) => InlineMarkdownNode[],
  ) => InlineMarkdownNode
}

const codeRule: InlineRule = {
  pattern: /`(.*?)`/,
  map: result => ({
    kind: "code",
    content: result[1] ?? "",
  }),
  mapHighlighting: result => ({
    kind: "code",
    content: `\`${result[1] ?? ""}\``,
  }),
}

const boldWithItalicRule: InlineRule = {
  pattern: /(?<!\\)\*\*((.*?[^\\*])?\*(?!\*).*?[^\\*]\*.*?)(?<!\\)\*\*/,
  map: (result, parseInside) => ({
    kind: "bold",
    content: parseInside(result[1] ?? ""),
  }),
  mapHighlighting: (result, parseInside) => ({
    kind: "bold",
    content: [textNode("**"), ...parseInside(result[1] ?? ""), textNode("**")],
  }),
}

const italicWithBoldRule: InlineRule = {
  pattern: /(?<![\\*])\*(?=\*\*|[^*])(.*?\*\*.*?\*\*.*?)(?<=[^\\*]|[^\\]\*\*)\*(?!\*)/,
  map: (result, parseInside) => ({
    kind: "italic",
    content: parseInside(result[1] ?? ""),
  }),
  mapHighlighting: (result, parseInside) => ({
    kind: "italic",
    content: [textNode("*"), ...parseInside(result[1] ?? ""), textNode("*")],
  }),
}

const boldRule: InlineRule = {
  pattern: /(?<!\\)\*\*(.*?[^\\*])\*\*/,
  map: (result, parseInside) => ({
    kind: "bold",
    content: parseInside(result[1] ?? ""),
  }),
  mapHighlighting: (result, parseInside) => ({
    kind: "bold",
    content: [textNode("**"), ...parseInside(result[1] ?? ""), textNode("**")],
  }),
}

const italicRule: InlineRule = {
  pattern: /(?<!\\)\*(.*?[^\\*])\*/,
  map: (result, parseInside) => ({
    kind: "italic",
    content: parseInside(result[1] ?? ""),
  }),
  mapHighlighting: (result, parseInside) => ({
    kind: "italic",
    content: [textNode("*"), ...parseInside(result[1] ?? ""), textNode("*")],
  }),
}

const linkRule: InlineRule = {
  pattern: /(?<!\\)\[(.*?[^\\])\]\((.*?[^\\])\)/,
  map: (result, parseInside) => ({
    kind: "link",
    href: result[2] ?? "",
    content: parseInside(result[1] ?? ""),
  }),
  mapHighlighting: (result, parseInside) => ({
    kind: "link",
    href: result[2] ?? "",
    content: [textNode("["), ...parseInside(result[1] ?? ""), textNode(`](${result[2] ?? ""})`)],
  }),
}

const textNode = (content: string): TextNode => ({
  kind: "text",
  content: content,
})

const parseEscapedCharacters = (text: string) => text.replace(/\\([*_`[\]()\\])/g, "$1")

const textRule: InlineRule = {
  pattern: /.+/,
  map: result => ({
    kind: "text",
    content: parseEscapedCharacters(result[0]),
  }),
  mapHighlighting: result => ({
    kind: "text",
    content: result[0],
  }),
}

const inlineRules: InlineRule[] = [
  codeRule,
  linkRule,
  boldWithItalicRule,
  italicWithBoldRule,
  boldRule,
  italicRule,
  textRule,
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
  | {
      kind: "link"
      href: string
      content: InlineMarkdownNode[]
    }
  | TextNode

const parseForInlineRules = (
  rules: InlineRule[],
  text: string,
  forSyntaxHighlighting: boolean,
): InlineMarkdownNode[] => {
  if (text.length === 0 || rules[0] === undefined) {
    return []
  }

  const activeRule = rules[0]

  const res = activeRule.pattern.exec(text)
  if (res && (activeRule.predicate?.(res) ?? true)) {
    const { index } = res
    const before = text.slice(0, index)
    const after = text.slice(index + res[0].length)
    return [
      ...(before.length > 0
        ? parseForInlineRules(rules.slice(1), before, forSyntaxHighlighting)
        : []),
      (forSyntaxHighlighting ? activeRule.mapHighlighting : activeRule.map)(res, text =>
        parseForInlineRules(rules.slice(1), text, forSyntaxHighlighting),
      ),
      ...(after.length > 0 ? parseForInlineRules(rules, after, forSyntaxHighlighting) : []),
    ]
  } else {
    return parseForInlineRules(rules.slice(1), text, forSyntaxHighlighting)
  }
}

const parseInlineMarkdown = (text: string, forSyntaxHighlighting: boolean): InlineMarkdownNode[] =>
  parseForInlineRules(inlineRules, text, forSyntaxHighlighting)

type BlockRule = {
  pattern: RegExp
  predicate?: (result: RegExpExecArray) => boolean
  map: (result: RegExpExecArray) => BlockMarkdownNode
  mapHighlighting: (result: RegExpExecArray) => BlockSyntaxMarkdownNode[]
}

const listRule: BlockRule = {
  pattern: /^((?:(?:\d+\.|[-*]) [^\n]+?)(?:\n(?:\d+\.|[-*]) [^\n]+?)*)(\n{2,}|$)/,
  map: result => ({
    kind: "list",
    ordered: /^\d+\. /.test(result[0]),
    content: (result[1] ?? "").split("\n").map(item => ({
      kind: "listitem",
      content: parseInlineMarkdown(item.replace(/^\d+\. |[-*] /, ""), false),
    })),
  }),
  mapHighlighting: result => [
    ...(result[1] ?? "").split("\n").flatMap((item, index, array): BlockSyntaxMarkdownNode[] => [
      {
        kind: "listitemmarker",
        content: /^(\d+\. |[-*] )/.exec(item)?.[1] ?? "",
      },
      ...parseInlineMarkdown(item.replace(/^\d+\. |[-*] /, ""), true),
      ...(index < array.length - 1 ? [textNode("\n")] : []),
    ]),
    textNode(result[2] ?? ""),
  ],
}

const paragraphRule: BlockRule = {
  pattern: /^((?:[^\n]+?)(?:\n[^\n]+?)*)(\n{2,}|\s*$)/,
  map: result => ({
    kind: "paragraph",
    content: parseInlineMarkdown(result[1] ?? "", false),
  }),
  mapHighlighting: result => [
    ...parseInlineMarkdown(result[1] ?? "", true),
    textNode(result[2] ?? ""),
  ],
}

const removeSurroundingPipes = (text: string) => text.replace(/^\|/, "").replace(/\|$/, "")

const tableMarker = (text: string): BlockSyntaxMarkdownNode => ({
  kind: "tablemarker",
  content: text,
})

const tableRule: BlockRule = {
  pattern:
    /^(\| *)?(.+?(?: *(?<!\\)\| *.+?)+)( *\|)?\n((?:\| *)?(?:-{3,}|:-{2,}|-{2,}:|:-+:)(?: *\| *(?:-{3,}|:-{2,}|-{2,}:|:-+:))*(?: *\|)?)((?:\n\|? *.+?(?: *(?<!\\)\| *.+?)* *(?<!\\)\|?)+)(\n{2,}|$)/,
  map: result => ({
    kind: "table",
    header: result[2]?.split("|").map(th => parseInlineMarkdown(th.trim(), false)) ?? [],
    rows:
      result[5]
        ?.split("\n")
        .slice(1)
        .map(tr =>
          removeSurroundingPipes(tr)
            .split("|")
            .map(tc => parseInlineMarkdown(tc.trim(), false)),
        ) ?? [],
  }),
  mapHighlighting: result => [
    tableMarker(result[1] ?? ""),
    ...(result[2]
      ?.split("|")
      .flatMap((th, i): BlockSyntaxMarkdownNode[] =>
        i === 0
          ? parseInlineMarkdown(th, true)
          : [tableMarker("|"), ...parseInlineMarkdown(th, true)],
      ) ?? []),
    tableMarker((result[3] ?? "") + "\n" + (result[4] ?? "")),
    ...(result[5]
      ?.split("\n")
      .slice(1)
      .flatMap((tr): BlockSyntaxMarkdownNode[] => [
        textNode("\n"),
        ...tr
          .split("|")
          .flatMap((tc, i): BlockSyntaxMarkdownNode[] =>
            i === 0
              ? parseInlineMarkdown(tc, true)
              : [tableMarker("|"), ...parseInlineMarkdown(tc, true)],
          ),
      ]) ?? []),
    textNode(result[6] ?? ""),
  ],
}

const blockRules: BlockRule[] = [tableRule, listRule, paragraphRule]

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
  | {
      kind: "table"
      header: InlineMarkdownNode[][]
      rows: InlineMarkdownNode[][][]
    }

export type BlockSyntaxMarkdownNode =
  | InlineMarkdownNode
  | {
      kind: "listitemmarker"
      content: string
    }
  | {
      kind: "tablemarker"
      content: string
    }

const parseForBlockRules = (
  rules: BlockRule[],
  text: string,
  remainingRules: BlockRule[] = rules,
): BlockMarkdownNode[] => {
  if (text.length === 0 || remainingRules[0] === undefined) {
    return []
  }

  const activeRule = remainingRules[0]
  const res = activeRule.pattern.exec(text)
  if (res && (activeRule.predicate?.(res) ?? true)) {
    const { index } = res
    const after = text.slice(index + res[0].length)
    return [activeRule.map(res), ...(after.length > 0 ? parseForBlockRules(rules, after) : [])]
  } else {
    return parseForBlockRules(rules, text, remainingRules.slice(1))
  }
}

const parseForBlockRulesSyntaxHighlighting = (
  rules: BlockRule[],
  text: string,
  remainingRules: BlockRule[] = rules,
): BlockSyntaxMarkdownNode[] => {
  if (text.length === 0 || remainingRules[0] === undefined) {
    return []
  }

  const activeRule = remainingRules[0]
  const res = activeRule.pattern.exec(text)
  if (res && (activeRule.predicate?.(res) ?? true)) {
    const { index } = res
    const after = text.slice(index + res[0].length)
    return [
      ...activeRule.mapHighlighting(res),
      ...(after.length > 0 ? parseForBlockRulesSyntaxHighlighting(rules, after) : []),
    ]
  } else {
    return parseForBlockRulesSyntaxHighlighting(rules, text, remainingRules.slice(1))
  }
}

export const parseBlockMarkdown = (text: string): BlockMarkdownNode[] =>
  parseForBlockRules(blockRules, text)

export const parseBlockMarkdownForSyntaxHighlighting = (text: string): BlockSyntaxMarkdownNode[] =>
  parseForBlockRulesSyntaxHighlighting(blockRules, text)
