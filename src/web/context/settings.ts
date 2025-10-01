import { createContext } from "preact"
import type { SetStateAction } from "preact/compat"
import { defaultSettings, type UserSettings } from "../hooks/useSettings.ts"

export type SettingsContext = {
  settings: UserSettings
  setSetting: <K extends keyof UserSettings>(key: K, value: SetStateAction<UserSettings[K]>) => void
}

export const SettingsContext = createContext<SettingsContext>({
  settings: defaultSettings,
  setSetting: () => {},
})
