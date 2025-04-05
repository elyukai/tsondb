type Enumify<T extends Record<string, null>> = {
  [K in keyof T]: K
}

export type Enum<T extends Record<string, string>> = keyof T

export const enumOfObject = <T extends Record<string, null>>(obj: T): Enumify<T> =>
  Object.fromEntries(Object.keys(obj).map(key => [key, key])) as Enumify<T>
