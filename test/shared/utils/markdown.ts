import { deepEqual, equal } from "assert/strict"
import { describe, it, test } from "node:test"
import type {
  BlockMarkdownNode,
  BlockSyntaxMarkdownNode,
  InlineMarkdownNode,
} from "../../../src/shared/utils/markdown.ts"
import {
  parseBlockMarkdown,
  parseBlockMarkdownForSyntaxHighlighting,
  parseInlineMarkdown,
  parseInlineMarkdownForSyntaxHighlighting,
  reduceSyntaxNodes,
  syntaxNodeToString,
} from "../../../src/shared/utils/markdown.ts"

describe("parseInlineMarkdown", () => {
  it("parses superscript formatting", () => {
    deepEqual<InlineMarkdownNode[]>(parseInlineMarkdown("This is ^superscript^."), [
      { kind: "text", content: "This is " },
      { kind: "superscript", content: [{ kind: "text", content: "superscript" }] },
      { kind: "text", content: "." },
    ])
  })

  it("parses superscript formatting for syntax highlighting", () => {
    deepEqual<InlineMarkdownNode[]>(
      parseInlineMarkdownForSyntaxHighlighting("This is ^superscript^."),
      [
        { kind: "text", content: "This is " },
        { kind: "superscript", content: [{ kind: "text", content: "^superscript^" }] },
        { kind: "text", content: "." },
      ],
    )
  })
})

describe("parseBlockMarkdown", () => {
  it("parses a single bold Markdown formatting", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is **bold**"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          { kind: "bold", content: [{ kind: "text", content: "bold" }] },
        ],
      },
    ])
  })

  it("ignores leading newlines", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("\n\nThis is **bold**"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          { kind: "bold", content: [{ kind: "text", content: "bold" }] },
        ],
      },
    ])
  })

  it("preserves leading newlines for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting("\n\nThis is **bold**"),
      [
        { kind: "text", content: "\n\nThis is " },
        { kind: "bold", content: [{ kind: "text", content: "**bold**" }] },
      ],
    )
  })

  it("parses multiple bold Markdown formattings", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown("This is **bold** and this is also **bold**."),
      [
        {
          kind: "paragraph",
          content: [
            { kind: "text", content: "This is " },
            { kind: "bold", content: [{ kind: "text", content: "bold" }] },
            { kind: "text", content: " and this is also " },
            { kind: "bold", content: [{ kind: "text", content: "bold" }] },
            { kind: "text", content: "." },
          ],
        },
      ],
    )
  })

  it("parses italic Markdown formatting ", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is *italic*"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          { kind: "italic", content: [{ kind: "text", content: "italic" }] },
        ],
      },
    ])
  })

  it("parses multiple italic Markdown formatting ", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown("This is *italic* and this is also *italic*."),
      [
        {
          kind: "paragraph",
          content: [
            { kind: "text", content: "This is " },
            { kind: "italic", content: [{ kind: "text", content: "italic" }] },
            { kind: "text", content: " and this is also " },
            { kind: "italic", content: [{ kind: "text", content: "italic" }] },
            { kind: "text", content: "." },
          ],
        },
      ],
    )
  })

  it("parses bold and italic Markdown formatting", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is ***bold and italic***"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          {
            kind: "bold",
            content: [
              {
                kind: "italic",
                content: [{ kind: "text", content: "bold and italic" }],
              },
            ],
          },
        ],
      },
    ])
  })

  it("parses bold and partially italic Markdown formatting with the italic part at the end", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is **bold and *italic***"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          {
            kind: "bold",
            content: [
              { kind: "text", content: "bold and " },
              { kind: "italic", content: [{ kind: "text", content: "italic" }] },
            ],
          },
        ],
      },
    ])
  })

  it("parses bold and partially italic Markdown formatting with the italic part in the middle", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is **bold and *italic* in parts**"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          {
            kind: "bold",
            content: [
              { kind: "text", content: "bold and " },
              { kind: "italic", content: [{ kind: "text", content: "italic" }] },
              { kind: "text", content: " in parts" },
            ],
          },
        ],
      },
    ])
  })

  it("parses bold and partially italic Markdown formatting with the italic part at the start", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is ***italic* and bold**"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          {
            kind: "bold",
            content: [
              { kind: "italic", content: [{ kind: "text", content: "italic" }] },
              { kind: "text", content: " and bold" },
            ],
          },
        ],
      },
    ])
  })

  it("parses italic and partially bold Markdown formatting with the bold part at the start", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is ***bold** and italic*"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          {
            kind: "italic",
            content: [
              { kind: "bold", content: [{ kind: "text", content: "bold" }] },
              { kind: "text", content: " and italic" },
            ],
          },
        ],
      },
    ])
  })

  it("parses italic and partially bold Markdown formatting with the bold part in the middle", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is *partially **bold** and italic*"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          {
            kind: "italic",
            content: [
              { kind: "text", content: "partially " },
              { kind: "bold", content: [{ kind: "text", content: "bold" }] },
              { kind: "text", content: " and italic" },
            ],
          },
        ],
      },
    ])
  })

  it("parses italic and partially bold Markdown formatting with the bold part at the end", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is *italic and **bold***"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          {
            kind: "italic",
            content: [
              { kind: "text", content: "italic and " },
              { kind: "bold", content: [{ kind: "text", content: "bold" }] },
            ],
          },
        ],
      },
    ])
  })

  it("parses multiple formattings (first bold then italic) into multiple syntax nodes", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is **bold** and *italic*"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          { kind: "bold", content: [{ kind: "text", content: "bold" }] },
          { kind: "text", content: " and " },
          {
            kind: "italic",
            content: [{ kind: "text", content: "italic" }],
          },
        ],
      },
    ])
  })

  it("parses multiple formattings (first italic then bold) into multiple syntax nodes", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is *italic* and **bold**"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is " },
          {
            kind: "italic",
            content: [{ kind: "text", content: "italic" }],
          },
          { kind: "text", content: " and " },
          { kind: "bold", content: [{ kind: "text", content: "bold" }] },
        ],
      },
    ])
  })

  it("parses multiple adjacent formattings into multiple syntax nodes", () => {
    test("alternating styles", () => {
      deepEqual<BlockMarkdownNode[]>(
        parseBlockMarkdown(
          "This is a **bold** text before an *italic* and a **bold** and another *italic* text.",
        ),
        [
          {
            kind: "paragraph",
            content: [
              { kind: "text", content: "This is a " },
              { kind: "bold", content: [{ kind: "text", content: "bold" }] },
              { kind: "text", content: " text before an " },
              { kind: "italic", content: [{ kind: "text", content: "italic" }] },
              { kind: "text", content: " and a " },
              { kind: "bold", content: [{ kind: "text", content: "bold" }] },
              { kind: "text", content: " and another " },
              { kind: "italic", content: [{ kind: "text", content: "italic" }] },
              { kind: "text", content: " text." },
            ],
          },
        ],
      )
    })
    test("multiple of the same styles adjacent", () => {
      deepEqual<BlockMarkdownNode[]>(
        parseBlockMarkdown(
          "Here is another *italic* text and *another* with a **bold** in between, before it is an *italic* again. **Bold** and **bold** might also come directly after each other and an *italic* might also be followed directly by another **bold** one.",
        ),
        [
          {
            kind: "paragraph",
            content: [
              { kind: "text", content: "Here is another " },
              { kind: "italic", content: [{ kind: "text", content: "italic" }] },
              { kind: "text", content: " text and " },
              { kind: "italic", content: [{ kind: "text", content: "another" }] },
              { kind: "text", content: " with a " },
              { kind: "bold", content: [{ kind: "text", content: "bold" }] },
              { kind: "text", content: " in between, before it is an " },
              { kind: "italic", content: [{ kind: "text", content: "italic" }] },
              { kind: "text", content: " again. " },
              { kind: "bold", content: [{ kind: "text", content: "Bold" }] },
              { kind: "text", content: " and " },
              { kind: "bold", content: [{ kind: "text", content: "bold" }] },
              { kind: "text", content: " might also come directly after each other and an " },
              { kind: "italic", content: [{ kind: "text", content: "italic" }] },
              { kind: "text", content: " might also be followed directly by another " },
              { kind: "bold", content: [{ kind: "text", content: "bold" }] },
              { kind: "text", content: " one." },
            ],
          },
        ],
      )
    })
  })

  it("parses a single-line paragraph for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting("This is **bold**"),
      [
        { kind: "text", content: "This is " },
        { kind: "bold", content: [{ kind: "text", content: "**bold**" }] },
      ],
    )
  })

  it("parses a multi-line paragraph for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting("This is **bold**.\nThis is also **bold**."),
      [
        { kind: "text", content: "This is " },
        { kind: "bold", content: [{ kind: "text", content: "**bold**" }] },
        { kind: "text", content: ".\nThis is also " },
        { kind: "bold", content: [{ kind: "text", content: "**bold**" }] },
        { kind: "text", content: "." },
      ],
    )
  })

  it("parses multiple blocks", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(`This is a paragraph.

This is another paragraph.

- This is the first unordered list item.
- This is the second unordered list item.

This is yet another paragraph.

1. This is the first and only ordered list item.

This is the final paragraph.`),
      [
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This is a paragraph." }],
        },
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This is another paragraph." }],
        },
        {
          kind: "list",
          ordered: false,
          content: [
            {
              kind: "listItem",
              inlineLabel: [{ kind: "text", content: "This is the first unordered list item." }],
              content: [],
            },
            {
              kind: "listItem",
              inlineLabel: [{ kind: "text", content: "This is the second unordered list item." }],
              content: [],
            },
          ],
        },
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This is yet another paragraph." }],
        },
        {
          kind: "list",
          ordered: true,
          content: [
            {
              kind: "listItem",
              inlineLabel: [
                { kind: "text", content: "This is the first and only ordered list item." },
              ],
              content: [],
            },
          ],
        },
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This is the final paragraph." }],
        },
      ],
    )
  })

  it("parses a multi-dimensional unordered list", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(`- Item 1
  - Subitem 1.1
    - Subsubitem 1.1.1
    - Subsubitem 1.1.2
  - Subitem 1.2
- Item 2`),
      [
        {
          kind: "list",
          ordered: false,
          content: [
            {
              kind: "listItem",
              inlineLabel: [{ kind: "text", content: "Item 1" }],
              content: [
                {
                  kind: "list",
                  ordered: false,
                  content: [
                    {
                      kind: "listItem",
                      inlineLabel: [{ kind: "text", content: "Subitem 1.1" }],
                      content: [
                        {
                          kind: "list",
                          ordered: false,
                          content: [
                            {
                              kind: "listItem",
                              inlineLabel: [{ kind: "text", content: "Subsubitem 1.1.1" }],
                              content: [],
                            },
                            {
                              kind: "listItem",
                              inlineLabel: [{ kind: "text", content: "Subsubitem 1.1.2" }],
                              content: [],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      kind: "listItem",
                      inlineLabel: [{ kind: "text", content: "Subitem 1.2" }],
                      content: [],
                    },
                  ],
                },
              ],
            },
            {
              kind: "listItem",
              inlineLabel: [{ kind: "text", content: "Item 2" }],
              content: [],
            },
          ],
        },
      ],
    )
  })

  it("parses a multi-dimensional unordered list for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(`- Item 1
  - Subitem 1.1
    - Subsubitem 1.1.1
    - Subsubitem 1.1.2
  - Subitem 1.2
- Item 2`),
      [
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " Item 1\n  " },
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " Subitem 1.1\n    " },
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " Subsubitem 1.1.1\n    " },
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " Subsubitem 1.1.2\n  " },
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " Subitem 1.2\n" },
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " Item 2" },
      ],
    )
  })

  it("parses a multi-dimensional ordered list", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(`1. Item 1
  1. Subitem 1.1
    1. Subsubitem 1.1.1
    2. Subsubitem 1.1.2
  2. Subitem 1.2
2. Item 2`),
      [
        {
          kind: "list",
          ordered: true,
          content: [
            {
              kind: "listItem",
              inlineLabel: [{ kind: "text", content: "Item 1" }],
              content: [
                {
                  kind: "list",
                  ordered: true,
                  content: [
                    {
                      kind: "listItem",
                      inlineLabel: [{ kind: "text", content: "Subitem 1.1" }],
                      content: [
                        {
                          kind: "list",
                          ordered: true,
                          content: [
                            {
                              kind: "listItem",
                              inlineLabel: [{ kind: "text", content: "Subsubitem 1.1.1" }],
                              content: [],
                            },
                            {
                              kind: "listItem",
                              inlineLabel: [{ kind: "text", content: "Subsubitem 1.1.2" }],
                              content: [],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      kind: "listItem",
                      inlineLabel: [{ kind: "text", content: "Subitem 1.2" }],
                      content: [],
                    },
                  ],
                },
              ],
            },
            {
              kind: "listItem",
              inlineLabel: [{ kind: "text", content: "Item 2" }],
              content: [],
            },
          ],
        },
      ],
    )
  })

  it("parses a multi-dimensional ordered list for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(`1. Item 1
  1. Subitem 1.1
    1. Subsubitem 1.1.1
    2. Subsubitem 1.1.2
  2. Subitem 1.2
2. Item 2`),
      [
        { kind: "listItemMarker", content: "1." },
        { kind: "text", content: " Item 1\n  " },
        { kind: "listItemMarker", content: "1." },
        { kind: "text", content: " Subitem 1.1\n    " },
        { kind: "listItemMarker", content: "1." },
        { kind: "text", content: " Subsubitem 1.1.1\n    " },
        { kind: "listItemMarker", content: "2." },
        { kind: "text", content: " Subsubitem 1.1.2\n  " },
        { kind: "listItemMarker", content: "2." },
        { kind: "text", content: " Subitem 1.2\n" },
        { kind: "listItemMarker", content: "2." },
        { kind: "text", content: " Item 2" },
      ],
    )
  })

  it("parses a multi-dimensional mixed list", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(`- Item 1
  1. Subitem 1.1
    - Subsubitem 1.1.1
    - Subsubitem 1.1.2
  2. Subitem 1.2
- Item 2`),
      [
        {
          kind: "list",
          ordered: false,
          content: [
            {
              kind: "listItem",
              inlineLabel: [{ kind: "text", content: "Item 1" }],
              content: [
                {
                  kind: "list",
                  ordered: true,
                  content: [
                    {
                      kind: "listItem",
                      inlineLabel: [{ kind: "text", content: "Subitem 1.1" }],
                      content: [
                        {
                          kind: "list",
                          ordered: false,
                          content: [
                            {
                              kind: "listItem",
                              inlineLabel: [{ kind: "text", content: "Subsubitem 1.1.1" }],
                              content: [],
                            },
                            {
                              kind: "listItem",
                              inlineLabel: [{ kind: "text", content: "Subsubitem 1.1.2" }],
                              content: [],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      kind: "listItem",
                      inlineLabel: [{ kind: "text", content: "Subitem 1.2" }],
                      content: [],
                    },
                  ],
                },
              ],
            },
            {
              kind: "listItem",
              inlineLabel: [{ kind: "text", content: "Item 2" }],
              content: [],
            },
          ],
        },
      ],
    )
  })

  it("parses a multi-dimensional mixed list for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(`- Item 1
  1. Subitem 1.1
    - Subsubitem 1.1.1
    - Subsubitem 1.1.2
  2. Subitem 1.2
- Item 2`),
      [
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " Item 1\n  " },
        { kind: "listItemMarker", content: "1." },
        { kind: "text", content: " Subitem 1.1\n    " },
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " Subsubitem 1.1.1\n    " },
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " Subsubitem 1.1.2\n  " },
        { kind: "listItemMarker", content: "2." },
        { kind: "text", content: " Subitem 1.2\n" },
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " Item 2" },
      ],
    )
  })

  it("parses a link", () => {
    deepEqual<BlockMarkdownNode[]>(parseBlockMarkdown("This is a [link](https://example.com)!"), [
      {
        kind: "paragraph",
        content: [
          { kind: "text", content: "This is a " },
          {
            kind: "link",
            href: "https://example.com",
            content: [{ kind: "text", content: "link" }],
          },
          { kind: "text", content: "!" },
        ],
      },
    ])
  })

  it("parses a table", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(`Here is a table:

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

This was a table.
`),
      [
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "Here is a table:" }],
        },
        {
          kind: "table",
          columns: [{}, {}],
          header: [
            { kind: "tableCell", content: [{ kind: "text", content: "Header 1" }] },
            { kind: "tableCell", content: [{ kind: "text", content: "Header 2" }] },
          ],
          rows: [
            {
              kind: "tableRow",
              cells: [
                { kind: "tableCell", content: [{ kind: "text", content: "Cell 1" }] },
                { kind: "tableCell", content: [{ kind: "text", content: "Cell 2" }] },
              ],
            },
            {
              kind: "tableRow",
              cells: [
                { kind: "tableCell", content: [{ kind: "text", content: "Cell 3" }] },
                { kind: "tableCell", content: [{ kind: "text", content: "Cell 4" }] },
              ],
            },
          ],
        },
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This was a table." }],
        },
      ],
    )
  })

  it("parses a table for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(`Here is a table:

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

This was a table.
`),
      [
        { kind: "text", content: "Here is a table:\n\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Header 1 " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Header 2 " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|----------|----------|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 1   " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 2   " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 3   " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 4   " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n\nThis was a table.\n" },
      ],
    )
  })

  it("parses a table with a table caption", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(`Here is a table:

|# Table Caption     #|
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

This was a table.
`),
      [
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "Here is a table:" }],
        },
        {
          kind: "table",
          caption: [{ kind: "text", content: "Table Caption" }],
          columns: [{}, {}],
          header: [
            { kind: "tableCell", content: [{ kind: "text", content: "Header 1" }] },
            { kind: "tableCell", content: [{ kind: "text", content: "Header 2" }] },
          ],
          rows: [
            {
              kind: "tableRow",
              cells: [
                { kind: "tableCell", content: [{ kind: "text", content: "Cell 1" }] },
                { kind: "tableCell", content: [{ kind: "text", content: "Cell 2" }] },
              ],
            },
            {
              kind: "tableRow",
              cells: [
                { kind: "tableCell", content: [{ kind: "text", content: "Cell 3" }] },
                { kind: "tableCell", content: [{ kind: "text", content: "Cell 4" }] },
              ],
            },
          ],
        },
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This was a table." }],
        },
      ],
    )
  })

  it("parses a table with a table caption for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(`Here is a table:

|# Table Caption     #|
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

This was a table.
`),
      [
        { kind: "text", content: "Here is a table:\n\n" },
        { kind: "tableMarker", content: "|#" },
        { kind: "text", content: " Table Caption     " },
        { kind: "tableMarker", content: "#|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Header 1 " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Header 2 " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|----------|----------|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 1   " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 2   " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 3   " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 4   " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n\nThis was a table.\n" },
      ],
    )
  })

  it("parses a table with section headers", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(`Here is a table:

| Header 1      | Header 2      |
|---------------|---------------|
| Cell 1        | Cell 2        |
|===============|===============|
| Subheader 1   | Subheader 2   |
| Cell 3        | Cell 4        |
|===============|===============|
| Subheader 3                  ||
| Cell 5        | Cell 6        |
|---------------|---------------|
| Cell 7        | Cell 8        |

This was a table.
`),
      [
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "Here is a table:" }],
        },
        {
          kind: "table",
          columns: [{}, {}],
          header: [
            { kind: "tableCell", content: [{ kind: "text", content: "Header 1" }] },
            { kind: "tableCell", content: [{ kind: "text", content: "Header 2" }] },
          ],
          rows: [
            {
              kind: "tableSection",
              rows: [
                {
                  kind: "tableRow",
                  cells: [
                    { kind: "tableCell", content: [{ kind: "text", content: "Cell 1" }] },
                    { kind: "tableCell", content: [{ kind: "text", content: "Cell 2" }] },
                  ],
                },
              ],
            },
            {
              kind: "tableSection",
              header: [
                { kind: "tableCell", content: [{ kind: "text", content: "Subheader 1" }] },
                { kind: "tableCell", content: [{ kind: "text", content: "Subheader 2" }] },
              ],
              rows: [
                {
                  kind: "tableRow",
                  cells: [
                    { kind: "tableCell", content: [{ kind: "text", content: "Cell 3" }] },
                    { kind: "tableCell", content: [{ kind: "text", content: "Cell 4" }] },
                  ],
                },
              ],
            },
            {
              kind: "tableSection",
              header: [
                {
                  kind: "tableCell",
                  colSpan: 2,
                  content: [{ kind: "text", content: "Subheader 3" }],
                },
              ],
              rows: [
                {
                  kind: "tableRow",
                  cells: [
                    { kind: "tableCell", content: [{ kind: "text", content: "Cell 5" }] },
                    { kind: "tableCell", content: [{ kind: "text", content: "Cell 6" }] },
                  ],
                },
              ],
            },
            {
              kind: "tableSection",
              rows: [
                {
                  kind: "tableRow",
                  cells: [
                    { kind: "tableCell", content: [{ kind: "text", content: "Cell 7" }] },
                    { kind: "tableCell", content: [{ kind: "text", content: "Cell 8" }] },
                  ],
                },
              ],
            },
          ],
        },
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This was a table." }],
        },
      ],
    )
  })

  it("parses a table with section headers for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(`Here is a table:

| Header 1      | Header 2      |
|---------------|---------------|
| Cell 1        | Cell 2        |
|===============|===============|
| Subheader 1   | Subheader 2   |
| Cell 3        | Cell 4        |
|===============|===============|
| Subheader 3                  ||
| Cell 5        | Cell 6        |
|---------------|---------------|
| Cell 7        | Cell 8        |

This was a table.
`),
      [
        { kind: "text", content: "Here is a table:\n\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Header 1      " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Header 2      " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|---------------|---------------|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 1        " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 2        " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|===============|===============|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Subheader 1   " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Subheader 2   " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 3        " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 4        " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|===============|===============|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Subheader 3                  " },
        { kind: "tableMarker", content: "||" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 5        " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 6        " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|---------------|---------------|" },
        { kind: "text", content: "\n" },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 7        " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: " Cell 8        " },
        { kind: "tableMarker", content: "|" },
        { kind: "text", content: "\n\nThis was a table.\n" },
      ],
    )
  })

  it("parses an attributed string", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(`This is an ^[attributed](attr1: true, attr2: 2, attr3: "test") string.`),
      [
        {
          kind: "paragraph",
          content: [
            { kind: "text", content: "This is an " },
            {
              kind: "attributed",
              attributes: {
                attr1: true,
                attr2: 2,
                attr3: "test",
              },
              content: [{ kind: "text", content: "attributed" }],
            },
            { kind: "text", content: " string." },
          ],
        },
      ],
    )
  })

  it("parses an attributed string for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(
        `This is an ^[attributed](attr1: true, attr2: 2, attr3: "test") string.`,
      ),
      [
        { kind: "text", content: "This is an " },
        {
          kind: "attributed",
          attributes: { attr1: true, attr2: 2, attr3: "test" },
          content: [
            { kind: "text", content: "^[" },
            { kind: "text", content: "attributed" },
            { kind: "text", content: "](" },
            { kind: "text", content: "attr1" },
            { kind: "text", content: ": " },
            { kind: "text", content: "true" },
            { kind: "text", content: ", " },
            { kind: "text", content: "attr2" },
            { kind: "text", content: ": " },
            { kind: "text", content: "2" },
            { kind: "text", content: ", " },
            { kind: "text", content: "attr3" },
            { kind: "text", content: ": " },
            { kind: "text", content: '"test"' },
            { kind: "text", content: ")" },
          ],
        },
        { kind: "text", content: " string." },
      ],
    )
  })

  it("parses a text of paragraphs and headings", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(`# Heading 1

This is a paragraph under heading 1.

## Heading 2

This is a paragraph under heading 2.

### Heading 3

This is a paragraph under heading 3.
`),
      [
        {
          kind: "heading",
          level: 1,
          content: [{ kind: "text", content: "Heading 1" }],
        },
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This is a paragraph under heading 1." }],
        },
        {
          kind: "heading",
          level: 2,
          content: [{ kind: "text", content: "Heading 2" }],
        },
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This is a paragraph under heading 2." }],
        },
        {
          kind: "heading",
          level: 3,
          content: [{ kind: "text", content: "Heading 3" }],
        },
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This is a paragraph under heading 3." }],
        },
      ],
    )
  })

  it("parses a text of paragraphs and headings for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(`# Heading 1

This is a paragraph under heading 1.

## Heading 2

This is a paragraph under heading 2.

### Heading 3

This is a paragraph under heading 3.
`),
      [
        { kind: "headingMarker", content: "# " },
        { kind: "text", content: "Heading 1\n\nThis is a paragraph under heading 1.\n\n" },
        { kind: "headingMarker", content: "## " },
        { kind: "text", content: "Heading 2\n\nThis is a paragraph under heading 2.\n\n" },
        { kind: "headingMarker", content: "### " },
        { kind: "text", content: "Heading 3\n\nThis is a paragraph under heading 3.\n" },
      ],
    )
  })

  it("parses a single-line footnote", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown("This is a paragraph with a footnote.[^1]\n\n[^1]: This is the footnote."),
      [
        {
          kind: "paragraph",
          content: [
            { kind: "text", content: "This is a paragraph with a footnote." },
            {
              kind: "footnoteRef",
              label: "1",
            },
          ],
        },
        {
          kind: "footnote",
          label: "1",
          content: [
            {
              kind: "paragraph",
              content: [{ kind: "text", content: "This is the footnote." }],
            },
          ],
        },
      ],
    )
  })

  it("parses a single-line footnote for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(
        "This is a paragraph with a footnote.[^1]\n\n[^1]: This is the footnote.",
      ),
      [
        { kind: "text", content: "This is a paragraph with a footnote." },
        { kind: "footnoteRef", label: "[^1]" },
        { kind: "text", content: "\n\n" },
        { kind: "footnoteMarker", content: "[^1]:" },
        { kind: "text", content: " This is the footnote." },
      ],
    )
  })

  it("parses a multi-line footnote", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(
        `This is a paragraph with a footnote.[^1]

[^1]: This is the footnote.

  It has multiple paragraphs.

  - And
  - A
  - List

This is not part of the footnote anymore.`,
      ),
      [
        {
          kind: "paragraph",
          content: [
            { kind: "text", content: "This is a paragraph with a footnote." },
            {
              kind: "footnoteRef",
              label: "1",
            },
          ],
        },
        {
          kind: "footnote",
          label: "1",
          content: [
            {
              kind: "paragraph",
              content: [{ kind: "text", content: "This is the footnote." }],
            },
            {
              kind: "paragraph",
              content: [{ kind: "text", content: "It has multiple paragraphs." }],
            },
            {
              kind: "list",
              ordered: false,
              content: [
                { kind: "listItem", inlineLabel: [{ kind: "text", content: "And" }], content: [] },
                { kind: "listItem", inlineLabel: [{ kind: "text", content: "A" }], content: [] },
                { kind: "listItem", inlineLabel: [{ kind: "text", content: "List" }], content: [] },
              ],
            },
          ],
        },
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This is not part of the footnote anymore." }],
        },
      ],
    )
  })

  it("parses a multi-line footnote for syntax highlighting", () => {
    equal(
      parseBlockMarkdownForSyntaxHighlighting(`This is a paragraph with a footnote.[^1]

[^1]: This is the footnote.

  It has multiple paragraphs.

  - And
  - A
  - List

This is not part of the footnote anymore.`)
        .map(syntaxNodeToString)
        .join(""),
      `This is a paragraph with a footnote.[^1]

[^1]: This is the footnote.

  It has multiple paragraphs.

  - And
  - A
  - List

This is not part of the footnote anymore.`,
    )

    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(
        `This is a paragraph with a footnote.[^1]

[^1]: This is the footnote.

  It has multiple paragraphs.

  - And
  - A
  - List

This is not part of the footnote anymore.`,
      ),
      [
        { kind: "text", content: "This is a paragraph with a footnote." },
        { kind: "footnoteRef", label: "[^1]" },
        { kind: "text", content: "\n\n" },
        { kind: "footnoteMarker", content: "[^1]:" },
        { kind: "text", content: " This is the footnote.\n\n  It has multiple paragraphs.\n\n  " },
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " And\n  " },
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " A\n  " },
        { kind: "listItemMarker", content: "-" },
        { kind: "text", content: " List\n\nThis is not part of the footnote anymore." },
      ],
    )
  })

  it("parses special named sections", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(`This is a paragraph.

::: name

This is a special section.

:::

This is another paragraph.
`),
      [
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This is a paragraph." }],
        },
        {
          kind: "container",
          name: "name",
          content: [
            {
              kind: "paragraph",
              content: [{ kind: "text", content: "This is a special section." }],
            },
          ],
        },
        {
          kind: "paragraph",
          content: [{ kind: "text", content: "This is another paragraph." }],
        },
      ],
    )
  })

  it("parses special named sections for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(`This is a paragraph.

::: name

This is a special section.

:::

This is another paragraph.
`),
      [
        { kind: "text", content: "This is a paragraph.\n\n" },
        { kind: "sectionMarker", content: "::: name" },
        { kind: "text", content: "\n\nThis is a special section.\n\n" },
        { kind: "sectionMarker", content: ":::" },
        { kind: "text", content: "\n\nThis is another paragraph.\n" },
      ],
    )
  })

  it("parses definition lists", () => {
    deepEqual<BlockMarkdownNode[]>(
      parseBlockMarkdown(`Term 1
: Definition 1

Term 2
: Definition 2
: Definition 3

Term 3
: Definition 4 line 1

  Definition 4 line 2

Term 4
: Definition 5 line 1

  Definition 5 line 2
: Definition 6

Term 5 with **bold**
: Definition 7 with *italic* and a [link](https://example.com)
`),
      [
        {
          kind: "definitionList",
          content: [
            {
              kind: "definitionListItem",
              terms: [[{ kind: "text", content: "Term 1" }]],
              definitions: [
                [
                  {
                    kind: "paragraph",
                    content: [{ kind: "text", content: "Definition 1" }],
                  },
                ],
              ],
            },
            {
              kind: "definitionListItem",
              terms: [[{ kind: "text", content: "Term 2" }]],
              definitions: [
                [
                  {
                    kind: "paragraph",
                    content: [{ kind: "text", content: "Definition 2" }],
                  },
                ],
                [
                  {
                    kind: "paragraph",
                    content: [{ kind: "text", content: "Definition 3" }],
                  },
                ],
              ],
            },
            {
              kind: "definitionListItem",
              terms: [[{ kind: "text", content: "Term 3" }]],
              definitions: [
                [
                  {
                    kind: "paragraph",
                    content: [{ kind: "text", content: "Definition 4 line 1" }],
                  },
                  {
                    kind: "paragraph",
                    content: [{ kind: "text", content: "Definition 4 line 2" }],
                  },
                ],
              ],
            },
            {
              kind: "definitionListItem",
              terms: [[{ kind: "text", content: "Term 4" }]],
              definitions: [
                [
                  {
                    kind: "paragraph",
                    content: [{ kind: "text", content: "Definition 5 line 1" }],
                  },
                  {
                    kind: "paragraph",
                    content: [{ kind: "text", content: "Definition 5 line 2" }],
                  },
                ],
                [
                  {
                    kind: "paragraph",
                    content: [{ kind: "text", content: "Definition 6" }],
                  },
                ],
              ],
            },
            {
              kind: "definitionListItem",
              terms: [
                [
                  { kind: "text", content: "Term 5 with " },
                  { kind: "bold", content: [{ kind: "text", content: "bold" }] },
                ],
              ],
              definitions: [
                [
                  {
                    kind: "paragraph",
                    content: [
                      { kind: "text", content: "Definition 7 with " },
                      { kind: "italic", content: [{ kind: "text", content: "italic" }] },
                      { kind: "text", content: " and a " },
                      {
                        kind: "link",
                        href: "https://example.com",
                        content: [{ kind: "text", content: "link" }],
                      },
                    ],
                  },
                ],
              ],
            },
          ],
        },
      ],
    )
  })

  it("parses definition lists for syntax highlighting", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      parseBlockMarkdownForSyntaxHighlighting(`Term 1
: Definition 1

Term 2
: Definition 2
: Definition 3

Term 3
: Definition 4 line 1

  Definition 4 line 2

Term 4
: Definition 5 line 1

  Definition 5 line 2
: Definition 6

Term 5 with **bold**
: Definition 7 with *italic* and a [link](https://example.com)
`),
      [
        { kind: "text", content: "Term 1\n" },
        { kind: "definitionMarker", content: ":" },
        { kind: "text", content: " Definition 1\n\nTerm 2\n" },
        { kind: "definitionMarker", content: ":" },
        { kind: "text", content: " Definition 2\n" },
        { kind: "definitionMarker", content: ":" },
        { kind: "text", content: " Definition 3\n\nTerm 3\n" },
        { kind: "definitionMarker", content: ":" },
        { kind: "text", content: " Definition 4 line 1\n\n  Definition 4 line 2\n\nTerm 4\n" },
        { kind: "definitionMarker", content: ":" },
        { kind: "text", content: " Definition 5 line 1\n\n  Definition 5 line 2\n" },
        { kind: "definitionMarker", content: ":" },
        { kind: "text", content: " Definition 6\n\nTerm 5 with " },
        { kind: "bold", content: [{ kind: "text", content: "**bold**" }] },
        { kind: "text", content: "\n" },
        { kind: "definitionMarker", content: ":" },
        {
          kind: "text",
          content: " Definition 7 with ",
        },
        { kind: "italic", content: [{ kind: "text", content: "*italic*" }] },
        { kind: "text", content: " and a " },
        {
          kind: "link",
          href: "https://example.com",
          content: [{ kind: "text", content: "[link](https://example.com)" }],
        },
        { kind: "text", content: "\n" },
      ],
    )
  })
})

describe("reduceSyntaxNodes", () => {
  it("reduces adjacent text nodes into a single text node", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      reduceSyntaxNodes([
        {
          content: "# ",
          kind: "headingMarker",
        },
        {
          content: "Heading 1\n\n",
          kind: "text",
        },
        {
          content: "This is a paragraph under heading 1.",
          kind: "text",
        },
        {
          content: "\n\n",
          kind: "text",
        },
        {
          content: "## ",
          kind: "headingMarker",
        },
        {
          content: "Heading 2",
          kind: "text",
        },
        {
          content: "\n\n",
          kind: "text",
        },
        {
          content: "This is a paragraph under heading 2.",
          kind: "text",
        },
        {
          content: "\n\n",
          kind: "text",
        },
        {
          content: "### ",
          kind: "headingMarker",
        },
        {
          content: "Heading 3",
          kind: "text",
        },
        {
          content: "\n\n",
          kind: "text",
        },
        {
          content: "This is a paragraph under heading 3.",
          kind: "text",
        },
        {
          content: "\n",
          kind: "text",
        },
      ]),
      [
        { kind: "headingMarker", content: "# " },
        { kind: "text", content: "Heading 1\n\nThis is a paragraph under heading 1.\n\n" },
        { kind: "headingMarker", content: "## " },
        { kind: "text", content: "Heading 2\n\nThis is a paragraph under heading 2.\n\n" },
        { kind: "headingMarker", content: "### " },
        { kind: "text", content: "Heading 3\n\nThis is a paragraph under heading 3.\n" },
      ],
    )
  })

  it("does not reduce non-adjacent text nodes into a single text node", () => {
    deepEqual<BlockSyntaxMarkdownNode[]>(
      reduceSyntaxNodes([
        { kind: "text", content: "This is a " },
        { kind: "bold", content: [{ kind: "text", content: "bold" }] },
        { kind: "text", content: " paragraph." },
      ]),
      [
        { kind: "text", content: "This is a " },
        { kind: "bold", content: [{ kind: "text", content: "bold" }] },
        { kind: "text", content: " paragraph." },
      ],
    )
  })
})
