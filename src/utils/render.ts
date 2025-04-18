import { EOL } from "node:os"

export const prefixLines = (
  prefix: string,
  text: string,
  includeEmptyLines: boolean = false,
): string =>
  text
    .split(EOL)
    .map(line => (includeEmptyLines || line.length > 0 ? prefix + line : line))
    .join(EOL)

export const applyIndentation = (indentLevel: number, text: string, spaces: number): string =>
  prefixLines(" ".repeat(spaces * indentLevel), text)

export const joinSyntax = (...syntaxes: (string | undefined)[]): string =>
  syntaxes.filter(syntax => syntax !== undefined).join("")

export const syntax = (strings: TemplateStringsArray, ...values: (string | undefined)[]): string =>
  strings.reduce(
    (acc, str, i) => acc + str.replace(/\n/g, EOL) + (values[i] !== undefined ? values[i] : ""),
    "",
  )
