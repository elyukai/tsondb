export const assertExhaustive = (_x: never, msg = "The switch is not exhaustive."): never => {
  throw new Error(msg)
}
