import { isNotEmpty } from "../../utils/array.ts"
import { error, isOk, ok, reduce, type Result } from "../../utils/result.ts"
import { assertExhaustive } from "../../utils/typeSafety.ts"

export type KeyPath = string | string[]

export type KeyPathElement = { kind: "property"; name: string } | { kind: "index"; index: number }

export type ParsedKeyPath = KeyPathElement[]

const intPattern = /^(?:0|[1-9][0-9])*$/

export const parseKeyPath = (keyPath: KeyPath): ParsedKeyPath =>
  normalizeKeyPath(keyPath).map(part => {
    if (intPattern.test(part)) {
      return { kind: "index", index: Number.parseInt(part, 10) }
    } else {
      return { kind: "property", name: part }
    }
  })

export const normalizeKeyPath = (keyPath: KeyPath): string[] =>
  (Array.isArray(keyPath) ? keyPath : [keyPath]).flatMap(elem => elem.split("."))

export const renderKeyPath = (keyPath: KeyPath): string => normalizeKeyPath(keyPath).join(".")

export const renderParsedKeyPath = (keyPath: ParsedKeyPath): string =>
  keyPath
    .map(elem => {
      switch (elem.kind) {
        case "index":
          return elem.index.toString()
        case "property":
          return elem.name
        default:
          return assertExhaustive(elem)
      }
    })
    .join(".")

export const getAtKeyPath = <T>(
  value: T,
  previousPath: ParsedKeyPath,
  remainingKeyPath: ParsedKeyPath,
  throwOnPathMismatch: boolean,
  fArray: (value: T, index: number) => Result<T, (previousPath: string) => string>,
  fObject: (value: T, key: string) => Result<T, (previousPath: string) => string>,
  ...fs: ((value: T, key: KeyPathElement) => Result<[T, skipKey?: boolean], void>)[]
): T => {
  if (isNotEmpty(remainingKeyPath)) {
    const [key, ...remainingPath] = remainingKeyPath

    const getCaseAtKeyPath = <K extends KeyPathElement>(
      key: K,
      successFn: (key: K, value: T) => Result<T, (previousPath: string) => string>,
    ): T =>
      reduce(
        successFn(key, value),
        newValue =>
          getAtKeyPath(
            newValue,
            [...previousPath, key],
            remainingPath,
            throwOnPathMismatch,
            fArray,
            fObject,
            ...fs,
          ),
        error => {
          for (const f of fs) {
            const result = f(value, key)
            if (isOk(result)) {
              return getAtKeyPath(
                result.value[0],
                result.value[1] === true ? previousPath : [...previousPath, key],
                result.value[1] === true ? remainingKeyPath : remainingPath,
                throwOnPathMismatch,
                fArray,
                fObject,
                ...fs,
              )
            }
          }

          if (throwOnPathMismatch) {
            throw new TypeError(error(renderParsedKeyPath(previousPath)))
          } else {
            return value
          }
        },
      )

    switch (key.kind) {
      case "index":
        return getCaseAtKeyPath(key, (key, value) => fArray(value, key.index))
      case "property":
        return getCaseAtKeyPath(key, (key, value) => fObject(value, key.name))
      default:
        return assertExhaustive(key)
    }
  } else {
    return value
  }
}

export const getValueAtKeyPath = (
  value: unknown,
  keyPath: KeyPath,
  throwOnPathMismatch = false,
): unknown =>
  getAtKeyPath(
    value,
    [],
    parseKeyPath(keyPath),
    throwOnPathMismatch,
    (value, index) =>
      Array.isArray(value)
        ? index >= 0 && index < value.length
          ? ok(value[index])
          : error(
              previousPath =>
                `Array at key path "${previousPath}" does not contain the index ${index.toString()}.`,
            )
        : error(previousPath => `Key path "${previousPath}" does not contain an array.`),
    (value, name) =>
      typeof value === "object" && value !== null
        ? name in value
          ? ok((value as Record<typeof name, unknown>)[name])
          : error(
              previousPath =>
                `Object at key path "${previousPath}" does not contain the key ${name}.`,
            )
        : error(previousPath => `Key path "${previousPath}" does not contain an object.`),
  )
