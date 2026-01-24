import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { MessageError, parseMessage, type Model } from "messageformat"

const mergeAssoc = <V extends string | null>(
  acc: Record<string, V>,
  key: string,
  value: V,
): Record<string, V> => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- if there is a previous value and the current result is null, keep the more specific one
  return { ...acc, [key]: value ?? acc[key]! }
}

const reduceMapAssoc = <T, V extends string | null>(
  map: (item: T) => [string, V] | undefined,
  acc: Record<string, V>,
  item: T,
): Record<string, V> => {
  const result = map(item)
  if (result) {
    return mergeAssoc(acc, result[0], result[1])
  }
  return acc
}

const reduceADT = <T extends { type: string }, R>(
  cases: {
    [K in T["type"]]?: (acc: R, item: Extract<T, { type: K }>) => R
  },
  acc: R,
  item: T,
): R => {
  const caseFn = cases[item.type as keyof typeof cases]
  return caseFn?.(acc, item as Extract<T, { type: T["type"] }>) ?? acc
}

const extractParameterFromDeclaration = (
  decl: Model.Declaration,
): [string, string | null] | undefined => {
  switch (decl.type) {
    case "input":
      return [decl.name, decl.value.functionRef?.name ?? null]
    case "local":
      return undefined
    default:
      return assertExhaustive(decl)
  }
}

const extractParametersFromDeclarations = (
  decls: Model.Declaration[],
): Record<string, string | null> =>
  decls.reduce<Record<string, string | null>>(
    (acc, decl) => reduceMapAssoc(extractParameterFromDeclaration, acc, decl),
    {},
  )

const ignoreLocalVariables = (
  decls: Model.Declaration[],
  acc: Record<string, string | null>,
): Record<string, string | null> =>
  decls.reduce<Record<string, string | null>>(
    (acc, decl) =>
      reduceADT(
        {
          local: (acc, localDecl) => {
            const { [localDecl.name]: _, ...rest } = acc
            return rest
          },
        },
        acc,
        decl,
      ),
    acc,
  )

const reduceParametersFromPattern = (acc: Record<string, string | null>, pattern: Model.Pattern) =>
  pattern.reduce((acc, element) => {
    if (typeof element === "string") {
      return acc
    }

    return reduceADT(
      {
        expression: (acc, element) => {
          if (!element.arg) {
            return acc
          }

          return reduceADT(
            {
              variable: (acc, variable) =>
                mergeAssoc(acc, variable.name, element.functionRef?.name ?? null),
            },
            acc,
            element.arg,
          )
        },
      },
      acc,
      element,
    )
  }, acc)

export const extractParameterTypeNamesFromMessage = (
  message: string,
): Record<string, string | null> => {
  try {
    const dataModel = parseMessage(message)
    switch (dataModel.type) {
      case "message":
        return ignoreLocalVariables(
          dataModel.declarations,
          reduceParametersFromPattern(
            extractParametersFromDeclarations(dataModel.declarations),
            dataModel.pattern,
          ),
        )

      case "select": {
        return ignoreLocalVariables(
          dataModel.declarations,
          dataModel.selectors.reduce(
            (acc, variable) => mergeAssoc(acc, variable.name, null),
            dataModel.variants.reduce(
              (acc, variant) => reduceParametersFromPattern(acc, variant.value),
              extractParametersFromDeclarations(dataModel.declarations),
            ),
          ),
        )
      }

      default:
        return assertExhaustive(dataModel)
    }
  } catch (error) {
    if (error instanceof MessageError) {
      throw new MessageError(error.message, message)
    } else {
      throw error
    }
  }
}

export const mapParameterTypeNames = <T>(
  typeMap: Record<string, string | null>,
  map: (typeName: string | null) => T,
): Record<string, T> =>
  Object.fromEntries(
    Object.entries(typeMap).map(([key, typeName]): [string, T] => [key, map(typeName)]),
  )

/**
 * Checks whether one set of parameter types (`ext`) is a subset of (or equals)
 * another (`base`).
 */
export const extendsParameterTypes = (
  base: Record<string, string | null>,
  ext: Record<string, string | null>,
): boolean => {
  for (const [key, typeName] of Object.entries(ext)) {
    if (typeName === null || typeof typeName === "string") {
      const baseTypeName = base[key]
      if (baseTypeName === undefined) {
        // extra parameter not in base
        return false
      }

      if (typeof typeName === "string" && baseTypeName !== typeName) {
        // type in extension is neither null (any) nor matches the base type
        return false
      }
    }
  }

  return true
}
