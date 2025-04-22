export const validateLocaleIdentifier = (value: string): Error[] => {
  const localePattern = /^[a-z]{2,3}(-[A-Z]{2,3})?$/

  if (localePattern.test(value)) {
    return []
  }

  return [TypeError(`invalid locale identifier: ${JSON.stringify(value)}`)]
}
