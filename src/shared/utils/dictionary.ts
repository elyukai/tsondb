export type Dictionary<T> = readonly [Readonly<Record<string, T>>, readonly string[]]

export const emptyD: Dictionary<never> = [{}, []]

export const getD = <T>(dict: Dictionary<T>, key: string): T | undefined => dict[0][key]

export const getMapD = <T, U>(
  dict: Dictionary<T>,
  key: string,
  mapFn: (value: T) => U,
): U | undefined => {
  const value = getD(dict, key)
  return value === undefined ? undefined : mapFn(value)
}

export const hasD = <T>(dict: Dictionary<T>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(dict[0], key)

export const setD = <T>(dict: Dictionary<T>, key: string, value: T): Dictionary<T> => {
  if (hasD(dict, key)) {
    return [{ ...dict[0], [key]: value }, dict[1]]
  } else {
    return [{ ...dict[0], [key]: value }, [...dict[1], key]]
  }
}

export const removeD = <T>(dict: Dictionary<T>, key: string): Dictionary<T> => {
  if (hasD(dict, key)) {
    const { [key]: _, ...newRecord } = dict[0]
    return [newRecord, dict[1].filter(k => k !== key)]
  } else {
    return dict
  }
}

export const sizeD = (dict: Dictionary<unknown>): number => dict[1].length

export const toEntriesD = <T>(dict: Dictionary<T>): [string, T][] => Object.entries(dict[0])

export const fromEntriesD = <T>(entries: [string, T][]): Dictionary<T> => {
  const record: Record<string, T> = Object.fromEntries(entries)
  const keys: string[] = Object.keys(record)
  return [record, keys]
}

export const toValuesD = <T>(dict: Dictionary<T>): T[] => Object.values(dict[0])

export const forEachD = <T>(dict: Dictionary<T>, fn: (value: T, key: string) => void): void => {
  for (const [key, value] of Object.entries(dict[0])) {
    fn(value, key)
  }
}

export const forEachAsyncD = async <T>(
  dict: Dictionary<T>,
  fn: (value: T, key: string) => Promise<void>,
): Promise<void> => {
  for (const [key, value] of Object.entries(dict[0])) {
    await fn(value, key)
  }
}

export const modifyD = <T>(
  dict: Dictionary<T>,
  key: string,
  modifyFn: (currentValue: T | undefined) => T | undefined,
): Dictionary<T> => {
  const currentValue = getD(dict, key)
  const newValue = modifyFn(currentValue)

  if (newValue === undefined) {
    return removeD(dict, key)
  } else {
    return setD(dict, key, newValue)
  }
}

export const findD = <T>(
  dict: Dictionary<T>,
  predicate: (value: T, key: string) => boolean,
): T | undefined => {
  for (const [key, value] of Object.entries(dict[0])) {
    if (predicate(value, key)) {
      return value
    }
  }

  return undefined
}

export const mapFirstD = <T, U>(
  dict: Dictionary<T>,
  mapFn: (value: T, key: string) => U | undefined,
): U | undefined => {
  for (const [key, value] of Object.entries(dict[0])) {
    const mapped = mapFn(value, key)
    if (mapped !== undefined) {
      return mapped
    }
  }

  return undefined
}

export const mapD = <T, U>(
  dict: Dictionary<T>,
  mapFn: (value: T, key: string) => U,
): Dictionary<U> => {
  const newRecord: Record<string, U> = {}
  for (const [key, value] of Object.entries(dict[0])) {
    newRecord[key] = mapFn(value, key)
  }
  return [newRecord, dict[1]]
}
