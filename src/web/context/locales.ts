import { createContext } from "preact"
import type { SetStateAction } from "preact/compat"
import type { Dispatch } from "preact/hooks"

export const LocalesContext = createContext<{
  locales: string[]
  setLocales: Dispatch<SetStateAction<string[]>>
}>({ locales: [], setLocales: () => {} })
