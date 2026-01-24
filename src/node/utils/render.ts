import { mergeObjects } from "@elyukai/utils/object"
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

export type RenderResult = [imports: { [sourcePath: string]: string[] }, syntax: string]

export const emptyRenderResult: RenderResult = [{}, ""]

export const combineSyntaxes = (
  syntaxes: (RenderResult | string | undefined)[],
  separator = "",
): RenderResult =>
  syntaxes
    .filter(syntax => syntax !== undefined)
    .reduce(
      (acc: RenderResult, value, i) =>
        typeof value === "string"
          ? [acc[0], acc[1] + (i === 0 ? "" : separator) + value]
          : [mergeArraysByKey(acc[0], value[0]), acc[1] + (i === 0 ? "" : separator) + value[1]],
      emptyRenderResult,
    )

const mergeArraysByKey = (...arrayGroups: { [key: string]: string[] }[]) =>
  arrayGroups.reduce<{ [key: string]: string[] }>(
    (acc, arrayGroup) => mergeObjects(acc, arrayGroup, (a, b) => a.concat(b)),
    {},
  )

export const syntax = (
  strings: TemplateStringsArray,
  ...values: (RenderResult | string | undefined)[]
): RenderResult =>
  strings.reduce((acc, str, i) => {
    const nextValue = values[i]
    if (typeof nextValue === "string") {
      return [acc[0], acc[1] + str.replace(/\n/g, EOL) + nextValue]
    } else if (Array.isArray(nextValue)) {
      return [
        mergeArraysByKey(acc[0], nextValue[0]),
        acc[1] + str.replace(/\n/g, EOL) + nextValue[1],
      ]
    } else {
      return [acc[0], acc[1] + str.replace(/\n/g, EOL)]
    }
  }, emptyRenderResult)

export const getIndentation = (spaces: number, indentLevel: number): string =>
  " ".repeat(spaces * indentLevel)

export const indent = (spaces: number, indentLevel: number, text: RenderResult): RenderResult => [
  text[0],
  prefixLines(getIndentation(spaces, indentLevel), text[1]),
]
