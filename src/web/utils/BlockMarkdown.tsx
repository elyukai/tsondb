import {
  checkTableRowsAreSections,
  type BlockMarkdownNode,
  type TableCell,
  type TableColumnStyle,
} from "@elyukai/markdown"
import { isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { FunctionalComponent } from "preact"
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
  switch (node.type) {
    case "paragraph":
      return (
        <p>
          {insertBefore}
          {node.content.map((inline, ii) =>
            inline.type === "break" ? <br key={ii} /> : <InlineMarkdown key={ii} node={inline} />,
          )}
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
    case "list": {
      const Tag = node.ordered ? "ol" : "ul"
      return (
        <>
          {insertBefore}
          <Tag>
            {node.content.map((item, ii) => (
              <li key={ii}>
                {item.inlineLabel && item.inlineLabel.length > 0
                  ? item.inlineLabel.map((inline, iii) => (
                      <InlineMarkdown key={iii} node={inline} />
                    ))
                  : null}
                {item.content.map((content, iii) => (
                  <BlockMarkdown {...inheritableProps} key={iii} node={content} />
                ))}
              </li>
            ))}
          </Tag>
        </>
      )
    }
    case "table":
      return (
        <>
          {insertBefore}
          <table>
            {node.caption !== undefined && isNotEmpty(node.caption) && (
              <caption>
                {node.caption.length > 1
                  ? node.caption.map((captionLine, cli) => (
                      <div key={cli}>
                        {captionLine.map((inline, ci) => (
                          <InlineMarkdown key={ci} node={inline} />
                        ))}
                      </div>
                    ))
                  : node.caption[0].map((inline, ci) => <InlineMarkdown key={ci} node={inline} />)}
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
      const label = (
        <>
          <span
            class={
              "footnote__label" +
              (typeof node.label === "number" ? " footnote__label--numeric" : "")
            }
            data-reference={node.label}
            style={{ "--label": node.label }}
          >
            <span class="footnote-label">{node.label}</span>
            {footnoteLabelSuffix}
          </span>{" "}
        </>
      )

      return (
        <div role="note" class="footnote">
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
                {item.descriptions.map((definition, di) => (
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
  columns: TableColumnStyle[]
  cells: TableCell[]
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
