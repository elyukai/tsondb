import { styleText } from "node:util"

export const json = (value: unknown, useStyling: boolean) =>
  useStyling
    ? styleText("blue", value === undefined ? "undefined" : JSON.stringify(value, undefined, 2))
    : JSON.stringify(value, undefined, 2)

export const key = (str: string, useStyling: boolean) =>
  useStyling ? styleText(["yellow", "bold"], str) : str

export const entity = (str: string, useStyling: boolean) =>
  useStyling ? styleText("green", str) : str
