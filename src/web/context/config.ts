import { createContext } from "preact"
import type { WebConfig } from "../../shared/api.ts"

export const defaultWebConfig: WebConfig = {
  localeEntityName: undefined,
  defaultLocales: [],
}

export const ConfigContext = createContext<WebConfig>(defaultWebConfig)
