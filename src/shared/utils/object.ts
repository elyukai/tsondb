export const sortObjectKeys = (
  obj: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> =>
  Object.fromEntries([
    ...keys.flatMap(key => (obj[key] === undefined ? [] : [[key, obj[key]] as [string, unknown]])),
    ...Object.entries(obj).filter(([key]) => !keys.includes(key)),
  ])

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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      [key]: Object.hasOwn(acc, key) ? solveConflict(acc[key]!, value) : value,
    }),
    obj1,
  )

export type Leaves<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends unknown[]
        ? never
        : `${Exclude<K, symbol>}${Leaves<T[K]> extends never ? "" : `.${Leaves<T[K]>}`}`
    }[keyof T]
  : never

export const onlyKeys = <T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> =>
  Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key as K))) as Pick<T, K>
