export class OptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OptionError"
  }
}

export const validateOption = <T>(
  value: T,
  name: string,
  validator: (option: NonNullable<T>) => boolean,
): T => {
  if (value == null || validator(value)) {
    return value
  }

  throw new OptionError(`Invalid value for "${name}": ${JSON.stringify(value)}`)
}
