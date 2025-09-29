import { createContext } from "preact"

export type WebConfig = {
  localeEntityName: string | undefined
  defaultLocales: string[]
}

export const defaultWebConfig: WebConfig = {
  localeEntityName: undefined,
  defaultLocales: [],
}

export const ConfigContext = createContext<WebConfig>(defaultWebConfig)
