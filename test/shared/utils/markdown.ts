import { deepEqual } from "assert/strict"
import { describe, it } from "node:test"
import type { BlockMarkdownNode } from "../../../src/shared/utils/markdown.ts"
import { parseBlockMarkdown } from "../../../src/shared/utils/markdown.ts"

describe("parseBlockMarkdown", () => {
  it("should evaluate bold Markdown formatting to bold syntax node", () => {
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

  it("should evaluate italic Markdown formatting to italic syntax node", () => {
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

  it("should evaluate bold and italic Markdown formatting to bold and italic syntax node", () => {
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

  it("should evaluate bold and partially italic Markdown formatting to bold and italic syntax node", () => {
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

  it("should evaluate partially bold and italic Markdown formatting to bold and italic syntax node", () => {
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

  it("should evaluate multiple formattings (first bold then italic) into multiple syntax nodes", () => {
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

  it("should evaluate multiple formattings (first italic then bold) into multiple syntax nodes", () => {
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

  it("should evaluate multiple blocks into multiple block nodes", () => {
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

  it("should evaluate a link Markdown formatting to a link syntax node", () => {
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
})
