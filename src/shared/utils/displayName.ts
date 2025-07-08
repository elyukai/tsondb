import { SerializedEntityDecl } from "../../schema/index.js"

const getValueAtPath = (value: unknown, path: string): unknown => {
  const parts = path.split(".")
  let current: unknown = value
  for (const part of parts) {
    if (typeof current === "object" && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return current
}

type DisplayNameObject = { displayName: string; displayLocale?: string }

const getDisplayNameObjectFromPath = (
  localeMap: Record<string, unknown>,
  locale: string,
  path: string,
): DisplayNameObject | undefined => {
  const value = getValueAtPath(localeMap[locale], path)
  if (typeof value === "string") {
    return { displayName: value, displayLocale: locale }
  }
  return undefined
}

const getLocaleIndependentDisplayName = (displayName: string): DisplayNameObject => ({
  displayName,
})

export const getDisplayNameFromEntityInstance = (
  entity: SerializedEntityDecl,
  instance: unknown,
  defaultName: string,
  locales: string[] = [],
): DisplayNameObject => {
  const displayNamePath = entity.displayName ?? "name"

  if (typeof displayNamePath === "string") {
    return {
      displayName: (getValueAtPath(instance, displayNamePath) as string | undefined) ?? defaultName,
    }
  } else {
    const localeMapPath = displayNamePath.pathToLocaleMap ?? "translations"
    const localeMap = getValueAtPath(instance, localeMapPath) as Record<string, unknown> | undefined
    const pathInLocaleMap = displayNamePath.pathInLocaleMap ?? "name"
    type LocaleMapKey = keyof NonNullable<typeof localeMap>
    const availableLocales: LocaleMapKey[] = Object.keys(localeMap ?? {})

    return availableLocales.length === 0
      ? getLocaleIndependentDisplayName(defaultName)
      : locales.reduce(
          (name: DisplayNameObject | undefined, locale) =>
            name ?? getDisplayNameObjectFromPath(localeMap!, locale, pathInLocaleMap),
          undefined,
        ) ??
          getDisplayNameObjectFromPath(localeMap!, availableLocales[0]!, pathInLocaleMap) ??
          getLocaleIndependentDisplayName(defaultName)
  }
}
