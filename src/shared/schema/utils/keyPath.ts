import { isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { error, isOk, ok, reduce, type Result } from "@elyukai/utils/result"
import { assertExhaustive, trySafe } from "@elyukai/utils/typeSafety"

export type KeyPath = string | string[]

export type KeyPathElement = { kind: "property"; name: string } | { kind: "index"; index: number }

export type ParsedKeyPath = KeyPathElement[]

const intPattern = /^(?:0|[1-9][0-9])*$/u

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
    const [firstKey, ...remainingPath] = remainingKeyPath

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
        err => {
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
            throw new TypeError(err(renderParsedKeyPath(previousPath)))
          } else {
            return value
          }
        },
      )

    switch (firstKey.kind) {
      case "index":
        return getCaseAtKeyPath(firstKey, (key, innerValue) => fArray(innerValue, key.index))
      case "property":
        return getCaseAtKeyPath(firstKey, (key, innerValue) => fObject(innerValue, key.name))
      default:
        return assertExhaustive(firstKey)
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
    (innerValue, index) =>
      Array.isArray(innerValue)
        ? index >= 0 && index < innerValue.length
          ? ok(innerValue[index])
          : error(
              previousPath =>
                `Array at key path "${previousPath}" does not contain the index ${index.toString()}.`,
            )
        : error(previousPath => `Key path "${previousPath}" does not contain an array.`),
    (innerValue, name) =>
      typeof innerValue === "object" && innerValue !== null
        ? name in innerValue
          ? ok((innerValue as Record<typeof name, unknown>)[name])
          : error(
              previousPath =>
                `Object at key path "${previousPath}" does not contain the key ${name}.`,
            )
        : error(previousPath => `Key path "${previousPath}" does not contain an object.`),
  )

export const getValueAtKeyPathIfDefined = (value: unknown, keyPath: KeyPath): unknown =>
  trySafe(() => getValueAtKeyPath(value, keyPath, true))

const _setValueAtKeyPath = (value: unknown, keyPath: ParsedKeyPath, newValue: unknown): unknown => {
  if (isNotEmpty(keyPath)) {
    const [key, ...remainingPath] = keyPath

    switch (key.kind) {
      case "index":
        if (!Array.isArray(value)) {
          throw new TypeError(
            `Key path "${renderParsedKeyPath(keyPath)}" does not contain an array.`,
          )
        }

        return [
          ...(value.slice(0, key.index) as unknown[]),
          _setValueAtKeyPath(value[key.index], remainingPath, newValue),
          ...(value.slice(key.index + 1) as unknown[]),
        ]
      case "property":
        if (typeof value !== "object" || value === null) {
          throw new TypeError(
            `Key path "${renderParsedKeyPath(keyPath)}" does not contain an object.`,
          )
        }

        return {
          ...value,
          [key.name]: _setValueAtKeyPath(
            (value as Record<string, unknown>)[key.name],
            remainingPath,
            newValue,
          ),
        }
      default:
        return assertExhaustive(key)
    }
  } else {
    return newValue
  }
}

export const setValueAtKeyPath = (value: unknown, keyPath: KeyPath, newValue: unknown): unknown =>
  _setValueAtKeyPath(value, parseKeyPath(keyPath), newValue)
