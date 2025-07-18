import type { SerializedType } from "../../node/schema/types/Type.ts"
import { assertExhaustive } from "../../shared/utils/typeSafety.ts"
import type { GetDeclFromDeclName } from "../hooks/useSecondaryDeclarations.ts"

export const createTypeSkeleton = (
  getDeclFromDeclName: GetDeclFromDeclName,
  type: SerializedType,
): unknown => {
  switch (type.kind) {
    case "BooleanType":
      return false

    case "DateType":
      return type.time === true ? new Date().toISOString() : new Date().toDateString()

    case "FloatType":
      return 0.0

    case "IntegerType":
      return 0

    case "StringType":
      return ""

    case "ArrayType":
      return Array.from({ length: type.minItems ?? 0 }, () =>
        createTypeSkeleton(getDeclFromDeclName, type.items),
      )

    case "ObjectType":
      return Object.fromEntries(
        Object.entries(type.properties).flatMap(([key, memberDecl]) =>
          memberDecl.isRequired
            ? [[key, createTypeSkeleton(getDeclFromDeclName, memberDecl.type)]]
            : [],
        ),
      )

    case "TypeArgumentType":
      return undefined

    case "ReferenceIdentifierType":
      return ""

    case "IncludeIdentifierType": {
      const referencedDecl = getDeclFromDeclName(type.reference)

      if (referencedDecl === undefined) {
        return undefined
      }

      return createTypeSkeleton(getDeclFromDeclName, referencedDecl.type)
    }

    case "NestedEntityMapType":
      return {}

    case "EnumType": {
      const firstCase = Object.entries(type.values)[0]

      if (firstCase === undefined) {
        return {}
      }

      return {
        kind: firstCase[0],
        ...(firstCase[1].type === null
          ? {}
          : { [firstCase[0]]: createTypeSkeleton(getDeclFromDeclName, firstCase[1].type) }),
      }
    }

    default:
      return assertExhaustive(type)
  }
}
