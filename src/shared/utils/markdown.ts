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
  pattern: /(?<![\\^])\[(.*?[^\\])\]\((.*?[^\\])\)/,
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

const booleanAttributePattern = /^(true|false)/
const numberAttributePattern = /^(-?\d+(\.\d+)?)/
const stringAttributePattern = /^("(.*?)(?<!\\)"|'(.*?)(?<!\\)')/

const parseAttributeValue = (text: string): [string | number | boolean, string] | null => {
  const booleanResult = booleanAttributePattern.exec(text)
  if (booleanResult !== null) {
    return [booleanResult[1] === "true", booleanResult[0]]
  }

  const numberResult = numberAttributePattern.exec(text)
  if (numberResult !== null) {
    return [Number.parseFloat(numberResult[1] ?? "0"), numberResult[0]]
  }

  const stringResult = stringAttributePattern.exec(text)
  if (stringResult !== null) {
    return [stringResult[2] ?? stringResult[3] ?? "", stringResult[0]]
  }

  return null
}

const attributeNamePattern = /^(\w+)(: *)/
const attributeSeparatorPattern = /^,( *)/

type RawAttribute =
  | string
  | { name: string; separator: string; value: string | number | boolean; rawValue: string }

const parseNextAttributes = (text: string): RawAttribute[] => {
  const separatorResult = attributeSeparatorPattern.exec(text)
  if (separatorResult === null) {
    return []
  }

  const remainingText = text.slice(separatorResult[0].length)

  return [separatorResult[0], ...parseAttributes(remainingText)]
}

const parseAttributes = (text: string): RawAttribute[] => {
  const nameResult = attributeNamePattern.exec(text)

  if (nameResult === null) {
    return []
  }

  const name = nameResult[1] ?? ""
  const separator = nameResult[2] ?? ""

  const remainingText = text.slice(nameResult[0].length)
  const valueResult = parseAttributeValue(remainingText)

  if (valueResult === null) {
    return []
  }

  const [value, rawValue] = valueResult

  return [
    { name, separator, value, rawValue },
    ...parseNextAttributes(remainingText.slice(rawValue.length)),
  ]
}

const mapAttributesToObject = (
  rawAttributes: RawAttribute[],
): Record<string, string | number | boolean> =>
  Object.fromEntries(
    rawAttributes.filter(attr => typeof attr !== "string").map(attr => [attr.name, attr.value]),
  )

const mapAttributesToNodes = (rawAttributes: RawAttribute[]): InlineMarkdownNode[] =>
  rawAttributes.flatMap(attr =>
    typeof attr === "string"
      ? [textNode(attr)]
      : [textNode(attr.name), textNode(attr.separator), textNode(attr.rawValue)],
  )

const parsedAttributesLength = (rawAttributes: RawAttribute[]): number =>
  rawAttributes.reduce(
    (sum, attr) =>
      sum +
      (typeof attr === "string"
        ? attr.length
        : attr.name.length + attr.separator.length + attr.rawValue.length),
    0,
  )

const attributedRule: InlineRule = {
  pattern:
    /(?<!\\)\^\[(.*?[^\\])\]\(((?:\w+: *(?:true|false|\d+(?:\.\d+)?|"(.*?)(?<!\\)"|'(.*?)(?<!\\)'))(?:, *\w+: *(?:true|false|\d+(?:\.\d+)?|"(.*?)(?<!\\)"|'(.*?)(?<!\\)'))*)\)/,
  map: (result, parseInside) => ({
    kind: "attributed",
    attributes: mapAttributesToObject(parseAttributes(result[2] ?? "")),
    content: parseInside(result[1] ?? ""),
  }),
  mapHighlighting: (result, parseInside) => {
    const attributesText = result[2] ?? ""
    const attributes = parseAttributes(attributesText)
    const length = parsedAttributesLength(attributes)
    const unparsedText: InlineMarkdownNode[] =
      attributesText.length > length
        ? [{ kind: "text", content: attributesText.slice(length) }]
        : []
    return {
      kind: "attributed",
      attributes: mapAttributesToObject(attributes),
      content: [
        textNode("^["),
        ...parseInside(result[1] ?? ""),
        textNode("]("),
        ...mapAttributesToNodes(attributes),
        ...unparsedText,
        textNode(")"),
      ],
    }
  },
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
  attributedRule,
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
  | {
      kind: "attributed"
      attributes: Record<string, string | number | boolean>
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

const nodesForTrailingWhitespace = (text: string | undefined): InlineMarkdownNode[] => {
  const trailingWhitespace = text ?? ""
  return trailingWhitespace.length === 0 ? [] : [textNode(trailingWhitespace)]
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
    ...nodesForTrailingWhitespace(result[2]),
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
    ...nodesForTrailingWhitespace(result[2]),
  ],
}

const headingRule: BlockRule = {
  pattern: /^(#+)( +)([^\s\n][^\n]*?)(\n{2,}|\s*$)/,
  map: result => ({
    kind: "heading",
    level: result[1]?.length ?? 1,
    content: parseInlineMarkdown(result[3] ?? "", false),
  }),
  mapHighlighting: result => [
    { kind: "headingmarker", content: (result[1] ?? "") + (result[2] ?? "") },
    ...parseInlineMarkdown(result[3] ?? "", true),
    ...nodesForTrailingWhitespace(result[4]),
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
    ...nodesForTrailingWhitespace(result[6]),
  ],
}

const blockRules: BlockRule[] = [headingRule, tableRule, listRule, paragraphRule]

export type BlockMarkdownNode =
  | {
      kind: "paragraph"
      content: InlineMarkdownNode[]
    }
  | {
      kind: "heading"
      level: number
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
  | {
      kind: "headingmarker"
      content: string
    }

const parseActiveBlockRule = (rule: BlockRule, res: RegExpExecArray): BlockMarkdownNode[] => [
  rule.map(res),
]

const parseActiveBlockSyntaxRule = (
  rule: BlockRule,
  res: RegExpExecArray,
): BlockSyntaxMarkdownNode[] => rule.mapHighlighting(res)

const parseForBlockRules = <R>(
  rules: BlockRule[],
  text: string,
  ruleParser: (rule: BlockRule, res: RegExpExecArray) => R[],
  remainingRules: BlockRule[] = rules,
): R[] => {
  if (text.length === 0 || remainingRules[0] === undefined) {
    return []
  }

  const activeRule = remainingRules[0]
  const res = activeRule.pattern.exec(text)
  if (res && (activeRule.predicate?.(res) ?? true)) {
    const { index } = res
    const after = text.slice(index + res[0].length)
    return [
      ...ruleParser(activeRule, res),
      ...(after.length > 0 ? parseForBlockRules(rules, after, ruleParser) : []),
    ]
  } else {
    return parseForBlockRules(rules, text, ruleParser, remainingRules.slice(1))
  }
}

export const parseBlockMarkdown = (text: string): BlockMarkdownNode[] =>
  parseForBlockRules(blockRules, text, parseActiveBlockRule)

export const parseBlockMarkdownForSyntaxHighlighting = (text: string): BlockSyntaxMarkdownNode[] =>
  parseForBlockRules(blockRules, text, parseActiveBlockSyntaxRule)
