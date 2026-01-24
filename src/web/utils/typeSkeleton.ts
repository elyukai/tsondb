import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { TranslationObjectTypeConstraint } from "../../node/schema/types/generic/TranslationObjectType.ts"
import type { SerializedAsType, SerializedType } from "../../shared/schema/types/Type.ts"
import type { GetDeclFromDeclName } from "../hooks/useSecondaryDeclarations.ts"

export const createTypeSkeleton = <T extends SerializedType>(
  getDeclFromDeclName: GetDeclFromDeclName,
  type: T,
): SerializedAsType<T> => {
  switch (type.kind) {
    case "BooleanType":
      return false as SerializedAsType<T>

    case "DateType":
      return (
        type.time === true ? new Date().toISOString() : new Date().toDateString()
      ) as SerializedAsType<T>

    case "FloatType":
      return 0.0 as SerializedAsType<T>

    case "IntegerType":
      return 0 as SerializedAsType<T>

    case "StringType":
      return "" as SerializedAsType<T>

    case "ArrayType":
      return Array.from({ length: type.minItems ?? 0 }, () =>
        createTypeSkeleton(getDeclFromDeclName, type.items),
      ) as SerializedAsType<T>

    case "ObjectType":
      return Object.fromEntries(
        Object.entries(type.properties).flatMap(([key, memberDecl]) =>
          memberDecl.isRequired
            ? [[key, createTypeSkeleton(getDeclFromDeclName, memberDecl.type)]]
            : [],
        ),
      ) as SerializedAsType<T>

    case "TypeArgumentType":
      return undefined as SerializedAsType<T>

    case "ReferenceIdentifierType":
      return "" as SerializedAsType<T>

    case "IncludeIdentifierType": {
      const referencedDecl = getDeclFromDeclName(type.reference)

      if (referencedDecl === undefined) {
        return undefined as SerializedAsType<T>
      }

      return createTypeSkeleton(getDeclFromDeclName, referencedDecl.type) as SerializedAsType<T>
    }

    case "NestedEntityMapType":
      return {} as SerializedAsType<T>

    case "EnumType": {
      const firstCase = Object.entries(type.values)[0]

      if (firstCase === undefined) {
        return {} as SerializedAsType<T>
      }

      return {
        kind: firstCase[0],
        ...(firstCase[1].type === null
          ? {}
          : { [firstCase[0]]: createTypeSkeleton(getDeclFromDeclName, firstCase[1].type) }),
      } as SerializedAsType<T>
    }

    case "ChildEntitiesType":
      return undefined as SerializedAsType<T>

    case "TranslationObjectType": {
      const createObject = (type: TranslationObjectTypeConstraint): Record<string, unknown> =>
        Object.fromEntries(
          Object.entries(type).map(([key, propType]) => [
            key,
            propType === null ? "" : createObject(propType),
          ]),
        )

      return createObject(type.properties) as SerializedAsType<T>
    }

    default:
      return assertExhaustive(type)
  }
}
