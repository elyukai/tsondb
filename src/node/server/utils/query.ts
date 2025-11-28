import type { Request } from "express"

export const getQueryParamString = (
  parsedQueryString: Request["query"],
  key: string,
): string | undefined => {
  const value = parsedQueryString[key]

  if (typeof value === "string") {
    return value
  }

  return
}
