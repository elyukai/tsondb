import { mapObject, sortObjectKeys, sortObjectKeysByIndex } from "@elyukai/utils/object"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { ENUM_DISCRIMINATOR_KEY } from "../../../shared/schema/declarations/EnumDecl.ts"
import { NodeKind } from "../../../shared/schema/Node.ts"
import type { Type } from "../dsl/index.ts"
import type { TranslationObjectTypeConstraint } from "../dsl/types/TranslationObjectType.ts"

const formatTranslationObjectValue = (
  type: TranslationObjectTypeConstraint,
  value: unknown,
): unknown =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? sortObjectKeysByIndex(
        Object.fromEntries(
          Object.entries(value).map(([key, item]) => [
            key,
            type[key] ? formatTranslationObjectValue(type[key], item) : item,
          ]),
        ),
        Object.keys(type),
      )
    : value

/**
 * Format the structure of a value to always look the same when serialized as JSON.
 */
export const formatValue = (type: Type, value: unknown): unknown => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return Array.isArray(value) ? value.map(item => formatValue(type.items, item)) : value
    case NodeKind.ObjectType:
      return typeof value === "object" && value !== null && !Array.isArray(value)
        ? sortObjectKeysByIndex(
            mapObject(value as Record<string, unknown>, (item, key) =>
              type.properties[key] ? formatValue(type.properties[key].type, item) : item,
            ),
            Object.keys(type.properties),
          )
        : value
    case NodeKind.IncludeIdentifierType:
      return formatValue(type.reference.type.value, value)
    case NodeKind.NestedEntityMapType:
      return typeof value === "object" && value !== null && !Array.isArray(value)
        ? sortObjectKeys(
            mapObject(value as Record<string, unknown>, item => formatValue(type.type.value, item)),
          )
        : value
    case NodeKind.EnumType: {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        ENUM_DISCRIMINATOR_KEY in value &&
        typeof value[ENUM_DISCRIMINATOR_KEY] === "string"
      ) {
        const caseName = value[ENUM_DISCRIMINATOR_KEY]
        const caseValue = (value as Record<typeof caseName, unknown>)[caseName]
        const caseType = type.values[caseName]?.type

        return {
          [ENUM_DISCRIMINATOR_KEY]: caseName,
          ...(caseValue == null || caseType == null
            ? {}
            : { [caseName]: formatValue(caseType, caseValue) }),
        }
      }

      return value
    }
    case NodeKind.ChildEntitiesType:
      return Array.isArray(value) ? value.toSorted() : value
    case NodeKind.TranslationObjectType:
      return formatTranslationObjectValue(type.properties, value)
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.TypeArgumentType:
    case NodeKind.ReferenceIdentifierType:
      return value
    default:
      return assertExhaustive(type)
  }
}
