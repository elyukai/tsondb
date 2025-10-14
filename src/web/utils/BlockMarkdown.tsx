import type { FunctionalComponent } from "preact"
import {
  checkTableRowsAreSections,
  type BlockMarkdownNode,
  type TableCellBlockNode,
  type TableColumnStyleBlockNode,
} from "../../shared/utils/markdown.ts"
import { assertExhaustive } from "../../shared/utils/typeSafety.ts"
import { InlineMarkdown } from "./InlineMarkdown.tsx"

type Props = {
  node: BlockMarkdownNode
  outerHeadingLevel?: number
  insertBefore?: preact.ComponentChildren
  footnoteLabelSuffix?: string
}

export const BlockMarkdown: FunctionalComponent<Props> = ({
  node,
  outerHeadingLevel = 0,
  insertBefore,
  footnoteLabelSuffix = ")",
}) => {
  const inheritableProps = { outerHeadingLevel, footnoteLabelSuffix }
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
              <TableRow columns={node.columns} cells={node.header} cellType="th" />
            </thead>
            {checkTableRowsAreSections(node.rows) ? (
              node.rows.map((section, si) => (
                <tbody key={si}>
                  {section.header && (
                    <TableRow columns={node.columns} cells={section.header} cellType="th" />
                  )}
                  {section.rows.map((row, ri) => (
                    <TableRow key={ri} columns={node.columns} cells={row.cells} />
                  ))}
                </tbody>
              ))
            ) : (
              <tbody>
                {node.rows.map((row, ri) => (
                  <TableRow key={ri} columns={node.columns} cells={row.cells} />
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
            <BlockMarkdown {...inheritableProps} key={i} node={childNode} />
          ))}
        </div>
      )
    case "footnote": {
      const isNumeric = /^\d+$/.test(node.label)
      const label = (
        <>
          <span
            class={"footnote-label" + (isNumeric ? " footnote-label--numeric" : "")}
            data-reference={node.label}
          >
            {node.label}
            {footnoteLabelSuffix}
          </span>{" "}
        </>
      )

      return (
        <div role="note">
          {insertBefore}
          {node.content.map((n, i) => (
            <BlockMarkdown {...inheritableProps} key={i} node={n} insertBefore={label} />
          ))}
        </div>
      )
    }
    case "definitionList":
      return (
        <>
          {insertBefore}
          <dl>
            {node.content.map((item, ii) => (
              <div key={ii}>
                {item.terms.map((term, ti) => (
                  <dt key={ti}>
                    {term.map((inline, iii) => (
                      <InlineMarkdown key={iii} node={inline} />
                    ))}
                  </dt>
                ))}
                {item.definitions.map((definition, di) => (
                  <dd key={di}>
                    {definition.map((n, i) => (
                      <BlockMarkdown {...inheritableProps} key={i} node={n} />
                    ))}
                  </dd>
                ))}
              </div>
            ))}
          </dl>
        </>
      )
    default:
      return assertExhaustive(node)
  }
}

const TableRow = ({
  columns,
  cells,
  cellType = "td",
}: {
  columns: TableColumnStyleBlockNode[]
  cells: TableCellBlockNode[]
  cellType?: "td" | "th"
}) => {
  const CellTag = cellType as keyof preact.JSX.IntrinsicElements

  return (
    <tr>
      {
        cells.reduce<[elements: preact.ComponentChildren[], columnIndex: number]>(
          ([elements, columnIndex], tc, ci) => [
            [
              ...elements,
              <CellTag
                key={ci}
                scope={cellType === "th" && cells.length === 1 ? "colgroup" : undefined}
                colSpan={tc.colSpan}
                style={
                  columns[columnIndex]?.alignment
                    ? { textAlign: columns[columnIndex].alignment }
                    : undefined
                }
              >
                {tc.content.map((inline, cii) => (
                  <InlineMarkdown key={cii} node={inline} />
                ))}
              </CellTag>,
            ],
            columnIndex + (tc.colSpan ?? 1),
          ],
          [[], 0],
        )[0]
      }
    </tr>
  )
}
