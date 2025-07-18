import type { SerializedEntityDecl } from "../../node/schema/index.ts"

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

export const getDisplayNameFromEntityInstance = (
  entity: SerializedEntityDecl,
  instance: unknown,
  defaultName: string,
  locales: string[] = [],
): string => {
  if (entity.displayName === null) {
    return defaultName
  }

  const displayNamePath = entity.displayName ?? "name"

  if (typeof displayNamePath === "string") {
    return (getValueAtPath(instance, displayNamePath) as string | undefined) ?? defaultName
  } else {
    const localeMapPath = displayNamePath.pathToLocaleMap ?? "translations"
    const localeMap = getValueAtPath(instance, localeMapPath) as Record<string, unknown> | undefined
    const pathInLocaleMap = displayNamePath.pathInLocaleMap ?? "name"
    type LocaleMapKey = keyof NonNullable<typeof localeMap>
    const availableLocales: LocaleMapKey[] = Object.keys(localeMap ?? {})

    return availableLocales.length === 0
      ? defaultName
      : (locales.reduce(
          (name: string | undefined, locale) =>
            name ??
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (getValueAtPath(localeMap![locale], pathInLocaleMap) as string | undefined),
          undefined,
        ) ??
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (getValueAtPath(localeMap![availableLocales[0]!], pathInLocaleMap) as
            | string
            | undefined) ??
          defaultName)
  }
}
