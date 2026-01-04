import type { GetDeclFromDeclName } from "../../../web/hooks/useSecondaryDeclarations.ts"
import { assertExhaustive } from "../../utils/typeSafety.ts"
import type { BaseNode } from "../Node.ts"
import type { SerializedArrayType } from "./ArrayType.ts"
import type { SerializedBooleanType } from "./BooleanType.ts"
import type { SerializedChildEntitiesType } from "./ChildEntitiesType.ts"
import type { SerializedDateType } from "./DateType.ts"
import type { SerializedEnumType } from "./EnumType.ts"
import type { SerializedFloatType } from "./FloatType.ts"
import type { SerializedIncludeIdentifierType } from "./IncludeIdentifierType.ts"
import type { SerializedIntegerType } from "./IntegerType.ts"
import type { SerializedNestedEntityMapType } from "./NestedEntityMapType.ts"
import type { SerializedMemberDecl, SerializedObjectType } from "./ObjectType.ts"
import type { SerializedReferenceIdentifierType } from "./ReferenceIdentifierType.ts"
import type { SerializedStringType } from "./StringType.ts"
import type { SerializedTranslationObjectType } from "./TranslationObjectType.ts"
import type { SerializedTypeArgumentType } from "./TypeArgumentType.ts"

export interface SerializedBaseType extends BaseNode {}

export type SerializedType =
  | SerializedBooleanType
  | SerializedDateType
  | SerializedFloatType
  | SerializedIntegerType
  | SerializedStringType
  | SerializedArrayType
  | SerializedObjectType
  | SerializedTypeArgumentType
  | SerializedReferenceIdentifierType
  | SerializedIncludeIdentifierType
  | SerializedNestedEntityMapType
  | SerializedEnumType
  | SerializedChildEntitiesType
  | SerializedTranslationObjectType

export type SerializedAsType<T extends SerializedType> =
  T extends SerializedArrayType<infer I>
    ? SerializedAsType<I>[]
    : T extends SerializedObjectType<infer P>
      ? {
          [K in keyof P]: P[K] extends SerializedMemberDecl<SerializedType, true>
            ? SerializedAsType<P[K]["type"]>
            : SerializedAsType<P[K]["type"]> | undefined
        }
      : T extends SerializedBooleanType
        ? boolean
        : T extends SerializedDateType
          ? Date
          : T extends SerializedFloatType
            ? number
            : T extends SerializedIntegerType
              ? number
              : T extends SerializedStringType
                ? string
                : T extends SerializedTypeArgumentType
                  ? unknown
                  : T extends SerializedIncludeIdentifierType
                    ? unknown
                    : T extends SerializedNestedEntityMapType
                      ? unknown
                      : T extends SerializedReferenceIdentifierType
                        ? unknown
                        : T extends SerializedChildEntitiesType
                          ? unknown
                          : T extends SerializedTranslationObjectType
                            ? unknown
                            : never

export const isSinglularInputFieldType = (
  getDeclFromDeclName: GetDeclFromDeclName,
  type: SerializedType,
): boolean => {
  switch (type.kind) {
    case "BooleanType":
    case "DateType":
    case "FloatType":
    case "IntegerType":
    case "ReferenceIdentifierType":
      return true
    case "ArrayType":
    case "ObjectType":
    case "TypeArgumentType":
    case "NestedEntityMapType":
    case "ChildEntitiesType":
    case "TranslationObjectType":
      return false
    case "EnumType":
      return Object.values(type.values).every(caseMember => caseMember.type === null)
    case "IncludeIdentifierType": {
      const secondaryDecl = getDeclFromDeclName(type.reference)
      return secondaryDecl
        ? isSinglularInputFieldType(getDeclFromDeclName, secondaryDecl.type)
        : false
    }
    case "StringType":
      return !(type.isMarkdown ?? false)
    default:
      return assertExhaustive(type)
  }
}
