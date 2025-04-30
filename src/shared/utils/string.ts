const letterOrDigit = /[a-zA-Z0-9]/
const uppercase = /[A-Z]/
const lowerCaseOrDigit = /[a-z0-9]/
const separator = /[^a-z0-9]/

const lastChar = (str: string) => str[str.length - 1]
const lastElement = <T>(arr: T[]) => arr[arr.length - 1]

const isAllUppercase = (str: string) => str === str.toUpperCase()

export const splitStringParts = (str: string): string[] =>
  [...str].reduce((acc: string[], char, i, strArr) => {
    if (acc.length === 0) {
      return letterOrDigit.test(char) ? [char] : acc
    }

    const lastPart = lastElement(acc)!

    if (uppercase.test(char)) {
      const lastCharOfLastPart = lastChar(lastPart)
      const nextChar = strArr[i + 1]

      if (
        lastCharOfLastPart === undefined ||
        (uppercase.test(lastCharOfLastPart) && (nextChar === undefined || separator.test(nextChar)))
      ) {
        return [...acc.slice(0, -1), lastPart + char]
      } else {
        return [...acc, char]
      }
    }

    if (lowerCaseOrDigit.test(char)) {
      return [...acc.slice(0, -1), lastPart + char]
    }

    if (lastPart === "") {
      return acc
    } else {
      return [...acc, ""]
    }
  }, [])

export const toPascalCase = (str: string): string =>
  splitStringParts(isAllUppercase(str) ? str.toLowerCase() : str)
    .map(part =>
      isAllUppercase(part) ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join("")

export const toCamelCase = (str: string): string =>
  splitStringParts(isAllUppercase(str) ? str.toLowerCase() : str)
    .map((part, i) =>
      i === 0
        ? part.toLowerCase()
        : isAllUppercase(part)
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join("")

export const toKebabCase = (str: string): string =>
  splitStringParts(str)
    .map(part => part.toLowerCase())
    .join("-")

export const toSnakeCase = (str: string): string =>
  splitStringParts(str)
    .map(part => part.toLowerCase())
    .join("_")

export const toTitleCase = (str: string): string =>
  splitStringParts(str)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")

export const commonPrefix = (...strs: string[]): string => {
  if (strs.length === 0) {
    return ""
  }

  return strs.reduce((accPrefix, str) => {
    const indexOfDifference = Array.from(accPrefix).findIndex((char, i) => str[i] !== char)
    return indexOfDifference === -1 ? accPrefix : accPrefix.slice(0, indexOfDifference)
  })
}
