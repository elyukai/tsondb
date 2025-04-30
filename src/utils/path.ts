import { sep } from "node:path"

export const ensureSpecialDirStart = (path: string): string =>
  new RegExp(`^\\.\\.?\\${sep}`).test(path) ? path : `./${path}`
