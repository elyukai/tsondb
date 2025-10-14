import type { FunctionalComponent } from "preact"
import {
  checkTableRowsAreSections,
  type BlockMarkdownNode,
  type TableCellBlockNode,
} from "../../shared/utils/markdown.ts"
import { assertExhaustive } from "../../shared/utils/typeSafety.ts"
import { InlineMarkdown } from "./InlineMarkdown.tsx"

type Props = {
  node: BlockMarkdownNode
  outerHeadingLevel?: number
  insertBefore?: preact.ComponentChildren
}

export const BlockMarkdown: FunctionalComponent<Props> = ({
  node,
  outerHeadingLevel = 0,
  insertBefore,
}) => {
  switch (node.kind) {
    case "paragraph":
      return (
        <p>
          {insertBefore}
          {node.content.map((inline, ii) => (
            <InlineMarkdown key={ii} node={inline} />
          ))}
        </p>
      )
    case "heading":
      const Tag =
        `h${(node.level + outerHeadingLevel).toString()}` as keyof preact.JSX.IntrinsicElements
      return (
        <Tag>
          {insertBefore}
          {node.content.map((inline, ii) => (
            <InlineMarkdown key={ii} node={inline} />
          ))}
        </Tag>
      )
    case "list":
      if (node.ordered) {
        return (
          <>
            {insertBefore}
            <ol>
              {node.content.map((item, ii) => (
                <li key={ii}>
                  {item.content.map((inline, iii) => (
                    <InlineMarkdown key={iii} node={inline} />
                  ))}
                </li>
              ))}
            </ol>
          </>
        )
      } else {
        return (
          <>
            {insertBefore}
            <ul>
              {node.content.map((item, ii) => (
                <li key={ii}>
                  {item.content.map((inline, iii) => (
                    <InlineMarkdown key={iii} node={inline} />
                  ))}
                </li>
              ))}
            </ul>
          </>
        )
      }
    case "table":
      return (
        <>
          {insertBefore}
          <table>
            {node.caption !== undefined && (
              <caption>
                {node.caption.map((inline, ci) => (
                  <InlineMarkdown key={ci} node={inline} />
                ))}
              </caption>
            )}
            <thead>
              <TableRow cells={node.header} cellType="th" />
            </thead>
            {checkTableRowsAreSections(node.rows) ? (
              node.rows.map((section, si) => (
                <tbody key={si}>
                  {section.header && <TableRow cells={section.header} cellType="th" />}
                  {section.rows.map((row, ri) => (
                    <TableRow key={ri} cells={row.cells} />
                  ))}
                </tbody>
              ))
            ) : (
              <tbody>
                {node.rows.map((row, ri) => (
                  <TableRow key={ri} cells={row.cells} />
                ))}
              </tbody>
            )}
          </table>
        </>
      )
    case "container":
      return (
        <div class={node.name}>
          {insertBefore}
          {node.content.map((childNode, i) => (
            <BlockMarkdown key={i} node={childNode} outerHeadingLevel={outerHeadingLevel} />
          ))}
        </div>
      )
    case "footnote": {
      const label = (
        <>
          <span class="footnote-label">
            {node.label}
            {/^\*+$/.test(node.label) ? ")" : ":"}
          </span>{" "}
        </>
      )
      return (
        <div role="note">
          {insertBefore}
          {node.content.map((n, i) => (
            <BlockMarkdown
              key={i}
              node={n}
              outerHeadingLevel={outerHeadingLevel}
              insertBefore={label}
            />
          ))}
        </div>
      )
    }
    default:
      return assertExhaustive(node)
  }
}

const TableRow = ({
  cells,
  cellType = "td",
}: {
  cells: TableCellBlockNode[]
  cellType?: "td" | "th"
}) => {
  const CellTag = cellType as keyof preact.JSX.IntrinsicElements

  return (
    <tr>
      {cells.map((tc, ci) => (
        <CellTag
          key={ci}
          scope={cellType === "th" && cells.length === 1 ? "colgroup" : undefined}
          colSpan={tc.colSpan}
        >
          {tc.content.map((inline, cii) => (
            <InlineMarkdown key={cii} node={inline} />
          ))}
        </CellTag>
      ))}
    </tr>
  )
}
