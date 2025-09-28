import type { GetWebConfigResponseBody } from "../../shared/api.ts"
import { getResource } from "../api.ts"

export const getWebConfig = () =>
  getResource<GetWebConfigResponseBody>("/api/config", { locales: [] })
