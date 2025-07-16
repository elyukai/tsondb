import { styleText } from "node:util"

export const json = (value: unknown) => styleText("blue", JSON.stringify(value, undefined, 2))
export const key = (str: string) => styleText(["yellow", "bold"], str)
export const entity = (str: string) => styleText("green", str)
