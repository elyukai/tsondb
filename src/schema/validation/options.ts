import { OptionError } from "../errors/OptionError.js"

export const validateOption = <T extends {}>(
  value: T | undefined,
  name: string,
  validator: (option: T) => boolean,
): T | undefined => {
  if (value === undefined || validator(value)) {
    return value
  }

  throw new OptionError(`Invalid value for "${name}": ${JSON.stringify(value)}`)
}
