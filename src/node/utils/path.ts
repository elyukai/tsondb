import { sep } from "node:path"

const specialDirStartRegex = new RegExp(`^\\.\\.?\\${sep}`, "u")

export const ensureSpecialDirStart = (path: string): string =>
  specialDirStartRegex.test(path) ? path : `./${path}`
