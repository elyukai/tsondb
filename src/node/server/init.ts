import type { HomeLayoutSection } from "../config.ts"
import type { TSONDB, ValidationOptions } from "../index.ts"
import type { TSONDBRequestLocals } from "./index.ts"

export const init = (
  db: TSONDB,
  validationOptions: Partial<ValidationOptions> = {},
  homeLayoutSections?: HomeLayoutSection[],
): Omit<TSONDBRequestLocals, "setLocal"> => {
  const defaultLocales = db.locales
  const requestLocals: Omit<TSONDBRequestLocals, "setLocal"> = {
    db,
    defaultLocales,
    locales: defaultLocales,
    homeLayoutSections,
    validationOptions,
  }

  return requestLocals
}

export const reinit = async (locals: TSONDBRequestLocals) => {
  await locals.db.sync()
}
