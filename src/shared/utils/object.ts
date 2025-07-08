export const sortObjectKeys = (
  obj: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> =>
  Object.fromEntries(keys.flatMap(key => (obj[key] === undefined ? [] : [[key, obj[key]]])))

export const sortObjectKeysAlphabetically = (
  obj: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)))

export const mergeObjects = <T>(
  obj1: Record<string, T>,
  obj2: Record<string, T>,
  solveConflict: (a: T, b: T) => T,
) =>
  Object.entries(obj2).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: Object.hasOwn(acc, key) ? solveConflict(acc[key]!, value) : value,
    }),
    obj1,
  )

export type Leaves<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends any[]
        ? never
        : `${Exclude<K, symbol>}${Leaves<T[K]> extends never ? "" : `.${Leaves<T[K]>}`}`
    }[keyof T]
  : never
