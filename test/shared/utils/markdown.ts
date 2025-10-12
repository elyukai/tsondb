import { deepEqual } from "assert/strict"
import { describe, it } from "node:test"
import type {
  BlockMarkdownNode,
  BlockSyntaxMarkdownNode,
} from "../../../src/shared/utils/markdown.ts"
import {
  parseBlockMarkdown,
  parseBlockMarkdownForSyntaxHighlighting,
  reduceSyntaxNodes,
} from "../../../src/shared/utils/markdown.ts"

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
              kind: "listitem",
              content: [{ kind: "text", content: "This is the first unordered list item." }],
            },
            {
              kind: "listitem",
              content: [{ kind: "text", content: "This is the second unordered list item." }],
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
              kind: "listitem",
              content: [{ kind: "text", content: "This is the first and only ordered list item." }],
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
          header: [
            [{ kind: "text", content: "Header 1" }],
            [{ kind: "text", content: "Header 2" }],
          ],
          rows: [
            [[{ kind: "text", content: "Cell 1" }], [{ kind: "text", content: "Cell 2" }]],
            [[{ kind: "text", content: "Cell 3" }], [{ kind: "text", content: "Cell 4" }]],
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
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Header 1 " },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Header 2 " },
        { kind: "tablemarker", content: "|\n|----------|----------|" },
        { kind: "text", content: "\n" },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Cell 1   " },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Cell 2   " },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: "\n" },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Cell 3   " },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Cell 4   " },
        { kind: "tablemarker", content: "|" },
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
          header: [
            [{ kind: "text", content: "Header 1" }],
            [{ kind: "text", content: "Header 2" }],
          ],
          rows: [
            [[{ kind: "text", content: "Cell 1" }], [{ kind: "text", content: "Cell 2" }]],
            [[{ kind: "text", content: "Cell 3" }], [{ kind: "text", content: "Cell 4" }]],
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
        { kind: "tablemarker", content: "|#" },
        { kind: "text", content: " Table Caption     " },
        { kind: "tablemarker", content: "#|" },
        { kind: "text", content: "\n" },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Header 1 " },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Header 2 " },
        { kind: "tablemarker", content: "|\n|----------|----------|" },
        { kind: "text", content: "\n" },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Cell 1   " },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Cell 2   " },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: "\n" },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Cell 3   " },
        { kind: "tablemarker", content: "|" },
        { kind: "text", content: " Cell 4   " },
        { kind: "tablemarker", content: "|" },
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
        { kind: "headingmarker", content: "# " },
        { kind: "text", content: "Heading 1\n\nThis is a paragraph under heading 1.\n\n" },
        { kind: "headingmarker", content: "## " },
        { kind: "text", content: "Heading 2\n\nThis is a paragraph under heading 2.\n\n" },
        { kind: "headingmarker", content: "### " },
        { kind: "text", content: "Heading 3\n\nThis is a paragraph under heading 3.\n" },
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
          kind: "headingmarker",
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
          kind: "headingmarker",
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
          kind: "headingmarker",
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
        { kind: "headingmarker", content: "# " },
        { kind: "text", content: "Heading 1\n\nThis is a paragraph under heading 1.\n\n" },
        { kind: "headingmarker", content: "## " },
        { kind: "text", content: "Heading 2\n\nThis is a paragraph under heading 2.\n\n" },
        { kind: "headingmarker", content: "### " },
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
