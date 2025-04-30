import { deepEqual, equal } from "assert/strict"
import { describe, it } from "node:test"
import {
  commonPrefix,
  splitStringParts,
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
} from "../../../src/shared/utils/string.js"

describe("splitStringParts", () => {
  it("should split strings of various cases into its parts", () => {
    deepEqual(splitStringParts("PascalCase"), ["Pascal", "Case"])
    deepEqual(splitStringParts("camelCase"), ["camel", "Case"])
    deepEqual(splitStringParts("snake_case"), ["snake", "case"])
    deepEqual(splitStringParts("kebab-case"), ["kebab", "case"])
    deepEqual(splitStringParts("UPPER_CASE"), ["UPPER", "CASE"])
    deepEqual(splitStringParts("UPPERCASE"), ["UPPERCASE"])
    deepEqual(splitStringParts("lowercase"), ["lowercase"])
    deepEqual(splitStringParts("stringWithURL"), ["string", "With", "URL"])
  })
})

describe("toPascalCase", () => {
  it("should convert PascalCase to PascalCase", () => {
    equal(toPascalCase("PascalCase"), "PascalCase")
  })

  it("should convert camelCase to CamelCase", () => {
    equal(toPascalCase("camelCase"), "CamelCase")
  })

  it("should convert snake_case to SnakeCase", () => {
    equal(toPascalCase("snake_case"), "SnakeCase")
  })

  it("should convert kebab-case to KebabCase", () => {
    equal(toPascalCase("kebab-case"), "KebabCase")
  })

  it("should convert UPPER_CASE to UpperCase", () => {
    equal(toPascalCase("UPPER_CASE"), "UpperCase")
  })

  it("should convert UPPERCASE to Uppercase", () => {
    equal(toPascalCase("UPPERCASE"), "Uppercase")
  })

  it("should convert lowercase to Lowercase", () => {
    equal(toPascalCase("lowercase"), "Lowercase")
  })

  it("should convert stringWithURL to StringWithURL", () => {
    equal(toPascalCase("stringWithURL"), "StringWithURL")
  })
})

describe("toCamelCase", () => {
  it("should convert PascalCase to pascalCase", () => {
    equal(toCamelCase("PascalCase"), "pascalCase")
  })

  it("should convert camelCase to camelCase", () => {
    equal(toCamelCase("camelCase"), "camelCase")
  })

  it("should convert snake_case to snakeCase", () => {
    equal(toCamelCase("snake_case"), "snakeCase")
  })

  it("should convert kebab-case to kebabCase", () => {
    equal(toCamelCase("kebab-case"), "kebabCase")
  })

  it("should convert UPPER_CASE to upperCase", () => {
    equal(toCamelCase("UPPER_CASE"), "upperCase")
  })

  it("should convert UPPERCASE to uppercase", () => {
    equal(toCamelCase("UPPERCASE"), "uppercase")
  })

  it("should convert lowercase to lowercase", () => {
    equal(toCamelCase("lowercase"), "lowercase")
  })

  it("should convert stringWithURL to stringWithURL", () => {
    equal(toCamelCase("stringWithURL"), "stringWithURL")
  })
})

describe("toKebabCase", () => {
  it("should convert PascalCase to pascal-case", () => {
    equal(toKebabCase("PascalCase"), "pascal-case")
  })

  it("should convert camelCase to camel-case", () => {
    equal(toKebabCase("camelCase"), "camel-case")
  })

  it("should convert snake_case to snake-case", () => {
    equal(toKebabCase("snake_case"), "snake-case")
  })

  it("should convert kebab-case to kebab-case", () => {
    equal(toKebabCase("kebab-case"), "kebab-case")
  })

  it("should convert UPPER_CASE to upper-case", () => {
    equal(toKebabCase("UPPER_CASE"), "upper-case")
  })

  it("should convert UPPERCASE to uppercase", () => {
    equal(toKebabCase("UPPERCASE"), "uppercase")
  })

  it("should convert lowercase to lowercase", () => {
    equal(toKebabCase("lowercase"), "lowercase")
  })

  it("should convert stringWithURL to string-with-url", () => {
    equal(toKebabCase("stringWithURL"), "string-with-url")
  })
})

describe("toSnakeCase", () => {
  it("should convert PascalCase to pascal_case", () => {
    equal(toSnakeCase("PascalCase"), "pascal_case")
  })

  it("should convert camelCase to camel_case", () => {
    equal(toSnakeCase("camelCase"), "camel_case")
  })

  it("should convert snake_case to snake_case", () => {
    equal(toSnakeCase("snake_case"), "snake_case")
  })

  it("should convert kebab-case to kebab_case", () => {
    equal(toSnakeCase("kebab-case"), "kebab_case")
  })

  it("should convert UPPER_CASE to upper_case", () => {
    equal(toSnakeCase("UPPER_CASE"), "upper_case")
  })

  it("should convert UPPERCASE to uppercase", () => {
    equal(toSnakeCase("UPPERCASE"), "uppercase")
  })

  it("should convert lowercase to lowercase", () => {
    equal(toSnakeCase("lowercase"), "lowercase")
  })

  it("should convert stringWithURL to string_with_url", () => {
    equal(toSnakeCase("stringWithURL"), "string_with_url")
  })
})

describe("commonPrefix", () => {
  it('should identify the common prefix of "helloWorld" and "helloEveryone" as "hello"', () => {
    equal(commonPrefix("helloWorld", "helloEveryone"), "hello")
  })

  it('should identify the common prefix of "helloWorld" and "hiEveryone" as "h"', () => {
    equal(commonPrefix("helloWorld", "hiEveryone"), "h")
  })

  it('should identify the common prefix of "helloWorld" and "hello" as "hello"', () => {
    equal(commonPrefix("helloWorld", "hello"), "hello")
  })

  it('should identify the common prefix of "hello" and "helloWorld" as "hello"', () => {
    equal(commonPrefix("hello", "helloWorld"), "hello")
  })

  it('should identify the common prefix of "hello" and "" as ""', () => {
    equal(commonPrefix("hello", ""), "")
  })

  it('should identify the common prefix of "" and "" as ""', () => {
    equal(commonPrefix("", ""), "")
  })
})
