import type { SetStateAction } from "preact/compat"
import { useCallback, useContext, useState, type Dispatch, type StateUpdater } from "preact/hooks"
import type { WebConfig } from "../context/config.ts"
import { defaultSettings, SettingsContext } from "../context/settings.ts"

export type UserSettings = {
  displayedLocales: string[]
  enumDisplay: "select" | "radio"
  gitSidebar: boolean
}

const settingsGuards: { [K in keyof UserSettings]: (v: unknown) => v is UserSettings[K] } = {
  displayedLocales: (v): v is string[] =>
    Array.isArray(v) && v.every(e => typeof e === "string") && v.length > 0,
  enumDisplay: (v): v is "select" | "radio" =>
    typeof v === "string" && ["select", "radio"].includes(v),
  gitSidebar: (v): v is boolean => typeof v === "boolean",
}

const defaultSettingsFromConfig = (config: WebConfig): UserSettings => ({
  ...defaultSettings,
  displayedLocales:
    config.defaultLocales.length > 0 ? config.defaultLocales : defaultSettings.displayedLocales,
})

export const useSettings = (config: WebConfig): SettingsContext => {
  const [settings, setSettings] = useState<UserSettings>(
    () =>
      Object.fromEntries(
        Object.entries(defaultSettingsFromConfig(config)).map(([key, initialValue]) => {
          const item = localStorage.getItem(key)

          if (item) {
            try {
              const parsed: unknown = JSON.parse(item)
              return [
                key,
                settingsGuards[key as keyof UserSettings](parsed) ? parsed : initialValue,
              ]
            } catch {
              return [key, initialValue]
            }
          }

          return [key, initialValue]
        }),
      ) as UserSettings,
  )

  return {
    settings,
    setSetting: useCallback(
      <K extends keyof UserSettings>(key: K, value: StateUpdater<UserSettings[K]>) => {
        setSettings(prev => {
          const newSettings = {
            ...prev,
            [key]: typeof value === "function" ? value(prev[key]) : value,
          }
          localStorage.setItem(key, JSON.stringify(newSettings[key]))
          return newSettings
        })
      },
      [],
    ),
  }
}

export const useSetting = <K extends keyof UserSettings>(
  key: K,
): [UserSettings[K], Dispatch<SetStateAction<UserSettings[K]>>] => {
  const { settings, setSetting } = useContext(SettingsContext)

  return [
    settings[key],
    useCallback(
      (value: SetStateAction<UserSettings[K]>) => {
        setSetting(key, value)
      },
      [key, setSetting],
    ),
  ]
}
