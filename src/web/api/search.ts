import type { SearchResponseBody } from "../../shared/api.ts"
import { getResource } from "../utils/api.ts"

export const searchInstances = async (locales: string[], query: string) =>
  getResource<SearchResponseBody>("/api/search", {
    locales,
    modifyUrl: url => {
      url.searchParams.set("q", query)
    },
  })
