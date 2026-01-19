export const assertExhaustive = (_x: never, msg = "The switch is not exhaustive."): never => {
  throw new Error(msg)
}

export const trySafe: {
  <T>(f: () => T): T | undefined
  <T>(f: () => T, defaultValue: T): T
} = <T>(f: () => T, defaultValue?: T): T => {
  try {
    return f()
  } catch {
    return defaultValue as T
  }
}
