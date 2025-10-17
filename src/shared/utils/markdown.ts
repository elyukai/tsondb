import { chunk } from "./array.ts"
import { omitUndefinedKeys } from "./object.ts"
import { assertExhaustive } from "./typeSafety.ts"

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
  pattern: /(?<!\\|\*\*.*)\*\*(([^\\*]*)?\*(?!\*).*?[^\\*]\*.*?)(?<!\\)\*\*/,
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
  pattern:
    /(?<![\\*]|[^\\]\*.*)\*(?=\*\*|[^*])([^*]*?\*\*[^*]*?\*\*[^*]*?)(?<=[^\\*]|[^\\]\*\*)\*(?!\*)/,
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
  map: ([_res, content = "", attributesText = ""], parseInside) => ({
    kind: "attributed",
    attributes: mapAttributesToObject(parseAttributes(attributesText)),
    content: parseInside(content),
  }),
  mapHighlighting: ([_res, content = "", attributesText = ""], parseInside) => {
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
        ...parseInside(content),
        textNode("]("),
        ...mapAttributesToNodes(attributes),
        ...unparsedText,
        textNode(")"),
      ],
    }
  },
}

const footnoteRefRule: InlineRule = {
  pattern: /(?<!\\)\[\^([a-zA-Z0-9*]+?)\]/,
  map: ([_match, label = ""]) => ({
    kind: "footnoteRef",
    label,
  }),
  mapHighlighting: ([match]) => ({
    kind: "footnoteRef",
    label: match,
  }),
}

const textNode = (content: string): TextNode => ({
  kind: "text",
  content: content,
})

const parseEscapedCharacters = (text: string) => text.replace(/\\([*_`[\]()\\])/g, "$1")

const textRule: InlineRule = {
  pattern: /.+/s,
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
  footnoteRefRule,
  textRule,
]

type TextNode = {
  kind: "text"
  content: string
}

type BoldMarkdownNode = {
  kind: "bold"
  content: InlineMarkdownNode[]
}

type ItalicMarkdownNode = {
  kind: "italic"
  content: InlineMarkdownNode[]
}

type CodeMarkdownNode = {
  kind: "code"
  content: string
}

type LinkMarkdownNode = {
  kind: "link"
  href: string
  content: InlineMarkdownNode[]
}

type AttributedStringMarkdownNode = {
  kind: "attributed"
  attributes: Record<string, string | number | boolean>
  content: InlineMarkdownNode[]
}

type FootnoteRefInlineNode = {
  kind: "footnoteRef"
  label: string
}

export type InlineMarkdownNode =
  | BoldMarkdownNode
  | ItalicMarkdownNode
  | CodeMarkdownNode
  | LinkMarkdownNode
  | AttributedStringMarkdownNode
  | TextNode
  | FootnoteRefInlineNode

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

const parseInlineMarkdown = (text: string): InlineMarkdownNode[] =>
  parseForInlineRules(inlineRules, text, false)

const parseInlineMarkdownForSyntaxHighlighting = (text: string): InlineMarkdownNode[] =>
  parseForInlineRules(inlineRules, text, true)

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
  pattern: /^((?:(?:\d+\.|[-*]) [^\n]+?)(?:\n(?:\d+\.|[-*]) [^\n]+?)*)(\n{2,}|\s*$)/,
  map: result => ({
    kind: "list",
    ordered: /^\d+\. /.test(result[0]),
    content: (result[1] ?? "").split("\n").map(item => ({
      kind: "listItem",
      content: parseInlineMarkdown(item.replace(/^\d+\. |[-*] /, "")),
    })),
  }),
  mapHighlighting: result => [
    ...(result[1] ?? "").split("\n").flatMap((item, index, array): BlockSyntaxMarkdownNode[] => [
      {
        kind: "listItemMarker",
        content: /^(\d+\. |[-*] )/.exec(item)?.[1] ?? "",
      },
      ...parseInlineMarkdownForSyntaxHighlighting(item.replace(/^\d+\. |[-*] /, "")),
      ...(index < array.length - 1 ? [textNode("\n")] : []),
    ]),
    ...nodesForTrailingWhitespace(result[2]),
  ],
}

const paragraphRule: BlockRule = {
  pattern: /^((?:[^\n]+?)(?:\n[^\n]+?)*)(\n{2,}|\s*$)/,
  map: ([_res, content = "", _trailingWhitespace]) => ({
    kind: "paragraph",
    content: parseInlineMarkdown(content),
  }),
  mapHighlighting: ([_res, content = "", trailingWhitespace]) => [
    ...parseInlineMarkdownForSyntaxHighlighting(content),
    ...nodesForTrailingWhitespace(trailingWhitespace),
  ],
}

const headingRule: BlockRule = {
  pattern: /^(#+)( +)([^\s\n][^\n]*?)(\n{2,}|\s*$)/,
  map: result => ({
    kind: "heading",
    level: result[1]?.length ?? 1,
    content: parseInlineMarkdown(result[3] ?? ""),
  }),
  mapHighlighting: result => [
    { kind: "headingMarker", content: (result[1] ?? "") + (result[2] ?? "") },
    ...parseInlineMarkdownForSyntaxHighlighting(result[3] ?? ""),
    ...nodesForTrailingWhitespace(result[4]),
  ],
}

const tableMarker = (text: string): BlockSyntaxMarkdownNode => ({
  kind: "tableMarker",
  content: text,
})

const sectionSeparatorPattern =
  /^\|? *-{3,} *(?:\| *-{3,} *)+\|?$|^\|? *={3,} *(?:\| *={3,} *)+\|?$/
const sectionWithHeaderSeparatorPattern = /^\|? *={3,} *(?:\| *={3,} *)+\|?$/

export const checkTableRowsAreSections = (
  rows: TableRowBlockNode[] | TableSectionBlockNode[],
): rows is TableSectionBlockNode[] => rows.every(row => row.kind === "tableSection")

const parseContentRow = (row: string): TableCellBlockNode[] =>
  row
    .replace(/^\|/, "")
    .split(/(\|+)/)
    .reduce<TableCellBlockNode[]>((acc, segment, index, arr) => {
      if (index % 2 === 0 && segment.trim() !== "") {
        const colSpan = arr[index + 1]?.length
        return [
          ...acc,
          omitUndefinedKeys({
            kind: "tableCell",
            colSpan: colSpan !== undefined && colSpan > 1 ? colSpan : undefined,
            content: parseInlineMarkdown(segment.trim()),
          }),
        ]
      }

      return acc
    }, [])

const parseContentRowForSyntaxHighlighting = (row: string): BlockSyntaxMarkdownNode[] =>
  row.split(/(\|+)/).reduce<BlockSyntaxMarkdownNode[]>((acc, segment, index) => {
    if (index % 2 === 0) {
      return [...acc, ...parseInlineMarkdownForSyntaxHighlighting(segment)]
    } else {
      return [...acc, tableMarker(segment)]
    }
  }, [])

const trimPipes = (text: string) => text.replace(/^\|/, "").replace(/\|$/, "")

const parseTableAlignment = (text: string): "left" | "center" | "right" | undefined => {
  const trimmed = text.trim()
  if (/^:-+:$/.test(trimmed)) {
    return "center"
  } else if (/^:-+$/.test(trimmed)) {
    return "left"
  } else if (/^-+:$/.test(trimmed)) {
    return "right"
  } else {
    return undefined
  }
}

const tableRule: BlockRule = {
  pattern:
    /^(?:(\|#)(.+?)(#\|)\n)?(\|)?(.+?(?:(?<!\\)\|.+?)+)((?<!\\)\|)?\n((?:\| *)?(?:-{3,}|:-{2,}|-{2,}:|:-+:)(?: *\| *(?:-{3,}|:-{2,}|-{2,}:|:-+:))*(?: *\|)?)((?:\n\|?.+?(?:(?<!\\)\|+.+?)*(?:(?<!\\)\|+)?)+)(\n{2,}|$)/,
  map: ([
    _res,
    _captionMarkerStart,
    caption,
    _captionMarkerEnd,
    _headerMarkerStart,
    headers,
    _headerMarkerEnd,
    bodySeparators = "",
    body,
    _trailingWhitespace,
  ]): TableBlockNode =>
    omitUndefinedKeys({
      kind: "table",
      caption:
        caption !== undefined
          ? parseInlineMarkdownForSyntaxHighlighting(caption.trim())
          : undefined,
      columns: trimPipes(bodySeparators)
        .split("|")
        .map(col =>
          omitUndefinedKeys({
            alignment: parseTableAlignment(col),
          }),
        ),
      header: headers ? parseContentRow(headers) : [],
      rows:
        body
          ?.split("\n")
          .slice(1) // leading newline due to regex
          .reduce<TableRowBlockNode[] | TableSectionBlockNode[]>((accRows, row) => {
            if (sectionSeparatorPattern.test(row)) {
              const hasHeader = sectionWithHeaderSeparatorPattern.test(row)
              const newSection: TableSectionBlockNode = omitUndefinedKeys({
                kind: "tableSection",
                header: hasHeader ? [] : undefined,
                rows: [],
              })

              if (accRows[0] === undefined) {
                return [newSection]
              }

              if (checkTableRowsAreSections(accRows)) {
                return [...accRows, newSection]
              }

              return [{ kind: "tableSection", rows: accRows }, newSection]
            }

            const lastRow = accRows[accRows.length - 1]
            const rowContent = parseContentRow(row)

            if (lastRow === undefined) {
              return [
                {
                  kind: "tableRow",
                  cells: rowContent,
                },
              ]
            }

            if (checkTableRowsAreSections(accRows)) {
              const lastSection = lastRow as TableSectionBlockNode
              if (lastSection.header !== undefined && lastSection.header.length === 0) {
                return [
                  ...accRows.slice(0, -1),
                  {
                    ...lastSection,
                    header: rowContent,
                  },
                ]
              }

              return [
                ...accRows.slice(0, -1),
                {
                  ...lastSection,
                  rows: [
                    ...lastSection.rows,
                    {
                      kind: "tableRow",
                      cells: rowContent,
                    },
                  ],
                },
              ]
            }

            return [
              ...accRows,
              {
                kind: "tableRow",
                cells: rowContent,
              },
            ]
          }, []) ?? [],
    }),
  mapHighlighting: ([
    _res,
    captionMarkerStart,
    caption,
    captionMarkerEnd,
    headerMarkerStart,
    headers,
    headerMarkerEnd,
    bodySeparators,
    body,
    trailingWhitespace,
  ]) => [
    ...(caption !== undefined
      ? [
          tableMarker(captionMarkerStart ?? ""),
          ...parseInlineMarkdownForSyntaxHighlighting(caption),
          tableMarker(captionMarkerEnd ?? ""),
          textNode("\n"),
        ]
      : []),
    tableMarker(headerMarkerStart ?? ""),
    ...(headers
      ?.split("|")
      .flatMap((th, i): BlockSyntaxMarkdownNode[] =>
        i === 0
          ? parseInlineMarkdownForSyntaxHighlighting(th)
          : [tableMarker("|"), ...parseInlineMarkdownForSyntaxHighlighting(th)],
      ) ?? []),
    tableMarker(headerMarkerEnd ?? ""),
    textNode("\n"),
    tableMarker(bodySeparators ?? ""),
    ...(body
      ?.split("\n")
      .slice(1)
      .flatMap((tr): BlockSyntaxMarkdownNode[] => [
        textNode("\n"),
        ...(sectionSeparatorPattern.test(tr)
          ? [tableMarker(tr)]
          : parseContentRowForSyntaxHighlighting(tr)),
      ]) ?? []),
    ...nodesForTrailingWhitespace(trailingWhitespace),
  ],
}

const containerRule: BlockRule = {
  pattern: /^::: ([\w-_]+)?(\n+)(.+?)\n:::(\n{2,}|\s*$)/s,
  map: ([
    _match,
    name,
    _leadingContentWhitespace,
    content,
    _trailingWhitespace,
  ]): BlockMarkdownNode => ({
    kind: "container",
    name: name ?? undefined,
    content: parseBlockMarkdown(content ?? ""),
  }),
  mapHighlighting: ([
    _match,
    name,
    leadingContentWhitespace = "",
    content,
    trailingWhitespace,
  ]): BlockSyntaxMarkdownNode[] => [
    { kind: "sectionMarker", content: `::: ${name ?? ""}` },
    textNode(leadingContentWhitespace),
    ...parseBlockMarkdownForSyntaxHighlighting(content ?? ""),
    textNode("\n"),
    { kind: "sectionMarker", content: ":::" },
    ...nodesForTrailingWhitespace(trailingWhitespace),
  ],
}

const removeIndentation = (text: string) =>
  text
    .split("\n")
    .map(line => line.replace(/^ {2}/, ""))
    .join("\n")

export const syntaxNodeToString = (node: BlockSyntaxMarkdownNode): string => {
  switch (node.kind) {
    case "bold":
    case "italic":
    case "link":
    case "attributed":
      return node.content.map(syntaxNodeToString).join("")
    case "text":
    case "code":
    case "listItemMarker":
    case "tableMarker":
    case "headingMarker":
    case "sectionMarker":
    case "footnoteMarker":
    case "definitionMarker":
      return node.content
    case "footnoteRef":
      return node.label
    default:
      return assertExhaustive(node)
  }
}

const addIndentationToSyntax = <T extends BlockSyntaxMarkdownNode>(
  nodes: T[],
  nextUpperNode?: BlockSyntaxMarkdownNode,
): T[] =>
  nodes.reduce<T[]>((accNodes, currentNode, index) => {
    switch (currentNode.kind) {
      case "bold":
      case "italic":
      case "link":
      case "attributed":
        return [
          ...accNodes,
          {
            ...currentNode,
            content: addIndentationToSyntax(currentNode.content, nodes[index + 1] ?? nextUpperNode),
          },
        ]
      case "text":
      case "code":
      case "listItemMarker":
      case "tableMarker":
      case "headingMarker":
      case "sectionMarker":
      case "footnoteMarker":
      case "definitionMarker": {
        const nextNode = nodes[index + 1] ?? nextUpperNode
        const currentContent =
          currentNode.content.endsWith("\n") &&
          nextNode &&
          /^[^\n]*?\S+?/.test(syntaxNodeToString(nextNode))
            ? currentNode.content + "  "
            : currentNode.content
        return [
          ...accNodes,
          { ...currentNode, content: currentContent.replace(/\n([^\n]*?\S+?)/g, "\n  $1") },
        ]
      }
      case "footnoteRef":
        return [...accNodes, currentNode]
      default:
        return assertExhaustive(currentNode)
    }
  }, [])

const footnoteRule: BlockRule = {
  pattern: /^\[\^([a-zA-Z0-9]+?)\]: (.+?(?:\n(?: {2}.+)?)*)(\n{2,}|\s*$)/,
  map: ([_match, label = "", content = "", _trailingWhitespace]): BlockMarkdownNode => ({
    kind: "footnote",
    label: label,
    content: parseBlockMarkdown(removeIndentation(content)),
  }),
  mapHighlighting: ([
    _match,
    label = "",
    content = "",
    trailingWhitespace,
  ]): BlockSyntaxMarkdownNode[] => [
    { kind: "footnoteMarker", content: `[^${label}]:` },
    textNode(" "),
    ...addIndentationToSyntax(parseBlockMarkdownForSyntaxHighlighting(removeIndentation(content))),
    ...nodesForTrailingWhitespace(trailingWhitespace),
  ],
}

const definitionListItemSeparatorPattern = /(^.+?(?=\n:)|\n\n[^: ].*?(?=\n:))/s

const definitionListRule: BlockRule = {
  pattern:
    /^((?:[^\n]+?(?:\n[^\n]+?)*)(?:\n: .+?(?:\n {2}.+?)*)+(?:\n\n(?:[^\n]+?(?:\n[^\n]+?)*)(?:\n: .+?(?:\n(?=\n)|\n {2}.+?)*))*)(\n{2,}|\s*$)/,
  map: ([_res, content = "", _trailingWhitespace]): DefinitionListBlockNode => {
    const definitionItemPairs = chunk(content.split(definitionListItemSeparatorPattern).slice(1), 2)
    const items = definitionItemPairs.map(([termsText = "", definitionsText = ""]) => {
      const terms = termsText
        .trim()
        .split("\n")
        .map(term => parseInlineMarkdown(term.trim()))
      const definitions = definitionsText
        .split("\n:")
        .slice(1)
        .map(definition => parseBlockMarkdown(removeIndentation(definition.trim())))
      return {
        kind: "definitionListItem" as const,
        terms,
        definitions,
      }
    })
    return {
      kind: "definitionList",
      content: items,
    }
  },
  mapHighlighting: ([_res, content = "", trailingWhitespace]): BlockSyntaxMarkdownNode[] => {
    const items = chunk(content.split(definitionListItemSeparatorPattern).slice(1), 2).flatMap(
      ([termsText = "", definitionsText = ""]) => {
        const terms = termsText
          .split("\n")
          .flatMap((term, index, termArray) => [
            ...parseInlineMarkdownForSyntaxHighlighting(term),
            ...(index < termArray.length - 1 ? [textNode("\n")] : []),
          ])
        const definitions = definitionsText
          .split("\n:")
          .slice(1)
          .flatMap((definition, defIndex, defArray): BlockSyntaxMarkdownNode[] => [
            { kind: "definitionMarker", content: ":" },
            ...addIndentationToSyntax(
              parseBlockMarkdownForSyntaxHighlighting(removeIndentation(definition)),
            ),
            ...(defIndex < defArray.length - 1 ? [textNode("\n")] : []),
          ])
        return [...terms, textNode("\n"), ...definitions]
      },
    )
    return [...items, ...nodesForTrailingWhitespace(trailingWhitespace)]
  },
}

const blockRules: BlockRule[] = [
  containerRule,
  headingRule,
  footnoteRule,
  tableRule,
  listRule,
  definitionListRule,
  paragraphRule,
]

export type ParagraphBlockNode = {
  kind: "paragraph"
  content: InlineMarkdownNode[]
}

export type HeadingBlockNode = {
  kind: "heading"
  level: number
  content: InlineMarkdownNode[]
}

export type ListBlockNode = {
  kind: "list"
  ordered: boolean
  content: ListItemNode[]
}

export type ListItemNode = {
  kind: "listItem"
  content: InlineMarkdownNode[]
}

export type TableBlockNode = {
  kind: "table"
  caption?: InlineMarkdownNode[]
  columns: TableColumnStyleBlockNode[]
  header: TableCellBlockNode[]
  rows: TableRowBlockNode[] | TableSectionBlockNode[]
}

export type TableColumnStyleBlockNode = {
  alignment?: "left" | "center" | "right"
}

export type TableSectionBlockNode = {
  kind: "tableSection"
  header?: TableCellBlockNode[]
  rows: TableRowBlockNode[]
}

export type TableRowBlockNode = {
  kind: "tableRow"
  cells: TableCellBlockNode[]
}

export type TableCellBlockNode = {
  kind: "tableCell"
  colSpan?: number
  content: InlineMarkdownNode[]
}

export type SectionBlockNode = {
  kind: "container"
  name?: string
  content: BlockMarkdownNode[]
}

export type FootnoteBlockNode = {
  kind: "footnote"
  label: string
  content: BlockMarkdownNode[]
}

export type DefinitionListBlockNode = {
  kind: "definitionList"
  content: DefinitionListItemBlockNode[]
}

export type DefinitionListItemBlockNode = {
  kind: "definitionListItem"
  terms: InlineMarkdownNode[][]
  definitions: BlockMarkdownNode[][]
}

export type BlockMarkdownNode =
  | ParagraphBlockNode
  | HeadingBlockNode
  | ListBlockNode
  | TableBlockNode
  | SectionBlockNode
  | FootnoteBlockNode
  | DefinitionListBlockNode

type ListItemMarkerSyntaxNode = {
  kind: "listItemMarker"
  content: string
}

type TableMarkerSyntaxNode = {
  kind: "tableMarker"
  content: string
}

type HeadingMarkerSyntaxNode = {
  kind: "headingMarker"
  content: string
}

type SectionMarkerSyntaxNode = {
  kind: "sectionMarker"
  content: string
}

type FootnoteMarkerSyntaxNode = {
  kind: "footnoteMarker"
  content: string
}

type DefinitionMarkerSyntaxNode = {
  kind: "definitionMarker"
  content: string
}

type SyntaxNode =
  | ListItemMarkerSyntaxNode
  | TableMarkerSyntaxNode
  | HeadingMarkerSyntaxNode
  | SectionMarkerSyntaxNode
  | FootnoteMarkerSyntaxNode
  | DefinitionMarkerSyntaxNode

export type BlockSyntaxMarkdownNode = InlineMarkdownNode | SyntaxNode

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

type BlockSyntaxMarkdownNodeByKind = {
  bold: BoldMarkdownNode
  italic: ItalicMarkdownNode
  code: CodeMarkdownNode
  link: LinkMarkdownNode
  attributed: AttributedStringMarkdownNode
  footnoteRef: FootnoteRefInlineNode
  text: TextNode
  listItemMarker: ListItemMarkerSyntaxNode
  tableMarker: TableMarkerSyntaxNode
  headingMarker: HeadingMarkerSyntaxNode
  sectionMarker: SectionMarkerSyntaxNode
  footnoteMarker: FootnoteMarkerSyntaxNode
  definitionMarker: DefinitionMarkerSyntaxNode
}

export const parseBlockMarkdown = (text: string): BlockMarkdownNode[] =>
  parseForBlockRules(blockRules, text, parseActiveBlockRule)

export const parseBlockMarkdownForSyntaxHighlighting = (text: string): BlockSyntaxMarkdownNode[] =>
  reduceSyntaxNodes(parseForBlockRules(blockRules, text, parseActiveBlockSyntaxRule))

export const reduceSyntaxNodes = <T extends BlockSyntaxMarkdownNode>(nodes: T[]): T[] =>
  nodes.reduce<T[]>((reducedNodes, node, index) => {
    const lastNode = index > 0 ? reducedNodes[reducedNodes.length - 1] : undefined
    const newLastNode = lastNode ? mergeSyntaxNodes(lastNode, node) : null

    if (newLastNode) {
      reducedNodes[reducedNodes.length - 1] = reduceSyntaxNode(newLastNode)
    } else {
      reducedNodes.push(reduceSyntaxNode(node))
    }
    return reducedNodes
  }, [])

type MergeFn<T> = <U extends T>(a: U, b: U) => U

const reduceSyntaxNode = <T extends BlockSyntaxMarkdownNode>(node: T): T => {
  switch (node.kind) {
    case "bold":
    case "italic":
    case "link":
      return { ...node, content: reduceSyntaxNodes(node.content) }
    case "code":
    case "attributed":
    case "text":
    case "listItemMarker":
    case "tableMarker":
    case "headingMarker":
    case "sectionMarker":
    case "footnoteMarker":
    case "footnoteRef":
    case "definitionMarker":
      return node
    default:
      return assertExhaustive(node)
  }
}

const syntaxNodeMergeRules: {
  [K in BlockSyntaxMarkdownNode["kind"]]: MergeFn<BlockSyntaxMarkdownNodeByKind[K]> | null
} = {
  bold: (a, b) => ({ ...a, content: [...a.content, ...b.content] }),
  italic: (a, b) => ({ ...a, content: [...a.content, ...b.content] }),
  code: (a, b) => ({ ...a, content: a.content + b.content }),
  text: (a, b) => ({ ...a, content: a.content + b.content }),
  listItemMarker: (a, b) => ({ ...a, content: a.content + b.content }),
  tableMarker: (a, b) => ({ ...a, content: a.content + b.content }),
  headingMarker: (a, b) => ({ ...a, content: a.content + b.content }),
  sectionMarker: (a, b) => ({ ...a, content: a.content + b.content }),
  footnoteMarker: (a, b) => ({ ...a, content: a.content + b.content }),
  definitionMarker: (a, b) => ({ ...a, content: a.content + b.content }),
  footnoteRef: null,
  link: null,
  attributed: null,
}

const mergeSyntaxNodes = <T extends BlockSyntaxMarkdownNode>(lastNode: T, node: T) => {
  if (lastNode.kind !== node.kind) {
    return null
  }

  const mergeFn = syntaxNodeMergeRules[lastNode.kind] as MergeFn<T> | null
  return mergeFn?.(lastNode, node) ?? null
}
