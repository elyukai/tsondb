import type { Request } from "express"

export const getLocalesFromRequest = (req: Request) => {
  const requestLocales = req.query["locales"]
  return Array.isArray(requestLocales) && requestLocales.every(locale => typeof locale === "string")
    ? requestLocales
    : typeof requestLocales === "string"
      ? [requestLocales]
      : undefined
}
