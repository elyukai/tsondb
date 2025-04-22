export const sortObjectKeys = (
  obj: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> =>
  Object.fromEntries(keys.flatMap(key => (obj[key] === undefined ? [] : [[key, obj[key]]])))

export const sortObjectKeysAlphabetically = (
  obj: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)))
