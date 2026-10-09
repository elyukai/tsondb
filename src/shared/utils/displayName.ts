import type { SerializedEntityDecl } from "../schema/declarations/EntityDecl.ts"

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

export type DisplayNameResult = { name: string; localeId?: string }

export const getSerializedDisplayNameFromEntityInstance = (
  entity: SerializedEntityDecl,
  instance: unknown,
  defaultName: string,
  locales: string[],
): DisplayNameResult => {
  const displayNamePath = entity.instanceDisplayName ?? "name"

  if (typeof displayNamePath === "string") {
    return {
      name: (getValueAtPath(instance, displayNamePath) as string | undefined) ?? defaultName,
      localeId: locales[0],
    }
  } else {
    const localeMapPath = displayNamePath.pathToLocaleMap ?? "translations"
    const localeMap = getValueAtPath(instance, localeMapPath) as Record<string, unknown> | undefined
    const pathInLocaleMap = displayNamePath.pathInLocaleMap ?? "name"
    type LocaleMapKey = keyof NonNullable<typeof localeMap>
    const availableLocales: LocaleMapKey[] = Object.keys(localeMap ?? {})

    return availableLocales.length === 0
      ? { name: defaultName }
      : (locales.reduce((name: { name: string; localeId: string } | undefined, locale) => {
          if (name) return name

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const possibleName = getValueAtPath(localeMap![locale], pathInLocaleMap) as
            | string
            | undefined
          if (possibleName) {
            return { name: possibleName, localeId: locale }
          } else {
            return undefined
          }
        }, undefined) ?? {
          name:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (getValueAtPath(localeMap![availableLocales[0]!], pathInLocaleMap) as
              | string
              | undefined) ?? defaultName,
        })
  }
}
