import type { GetWebConfigResponseBody } from "../../shared/api.ts"
import { getResource } from "../utils/api.ts"

export const getWebConfig = () =>
  getResource<GetWebConfigResponseBody>("/api/config", { locales: [] })
