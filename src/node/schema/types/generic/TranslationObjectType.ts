import { MessageError, parseMessage, validate } from "messageformat"
import type { SerializedTranslationObjectType } from "../../../../shared/schema/types/TranslationObjectType.ts"
import { sortObjectKeys } from "../../../../shared/utils/object.ts"
import {
  extendsParameterTypes,
  extractParameterTypeNamesFromMessage,
} from "../../../../shared/utils/translation.ts"
import { parallelizeErrors } from "../../../../shared/utils/validation.ts"
import { validateUnknownKeys } from "../../../../shared/validation/object.ts"
import { wrapErrorsIfAny } from "../../../utils/error.ts"
import { json, key as keyColor } from "../../../utils/errorFormatting.ts"
import type {
  CustomConstraintValidator,
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  Serialized,
  TypeArgumentsResolver,
  ValidationContext,
  Validator,
} from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import type { StringType } from "../primitives/StringType.ts"
import type { BaseType, StructureFormatter } from "../Type.ts"

type TConstraint = { [key: string]: null | TConstraint }

export type { TConstraint as TranslationObjectTypeConstraint }

export interface TranslationObjectType<T extends TConstraint = TConstraint> extends BaseType {
  kind: NodeKind["TranslationObjectType"]
  properties: T
  allKeysAreRequired: boolean
}

export const TranslationObjectType = <T extends TConstraint>(
  properties: T,
  options: {
    allKeysAreRequired?: boolean
  } = {},
): TranslationObjectType<T> => {
  const type: TranslationObjectType<T> = {
    allKeysAreRequired: false,
    ...options,
    kind: NodeKind.TranslationObjectType,
    properties,
  }

  return type
}

export { TranslationObjectType as TranslationObject }

export const isTranslationObjectType: Predicate<TranslationObjectType> = node =>
  node.kind === NodeKind.TranslationObjectType

export const getNestedDeclarationsInTranslationObjectType: GetNestedDeclarations<
  TranslationObjectType
> = addedDecls => addedDecls

const validateRecursively = (
  context: ValidationContext,
  allKeysAreRequired: boolean,
  type: TConstraint,
  value: unknown,
): Error[] => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`expected an object, but got ${json(value, context.useStyling)}`)]
  }

  const expectedKeys = Object.keys(type).filter(key => type[key] !== undefined)

  return parallelizeErrors([
    ...validateUnknownKeys(expectedKeys, Object.keys(value)),
    ...expectedKeys.map(key => {
      const propType = type[key] as TConstraint | null
      const propValue = (value as Record<string, unknown>)[key]

      if (allKeysAreRequired && propValue === undefined) {
        return TypeError(`missing required translation ${keyColor(`"${key}"`, context.useStyling)}`)
      }

      if (propType === null && propValue !== undefined && typeof propValue !== "string") {
        return TypeError(
          `expected a string at translation key ${keyColor(`"${key}"`, context.useStyling)}, but got ${json(
            propValue,
            context.useStyling,
          )}`,
        )
      }

      if (
        propType === null &&
        typeof propValue === "string" &&
        allKeysAreRequired &&
        propValue.length === 0
      ) {
        return TypeError(
          `expected a non-empty string at translation key ${keyColor(`"${key}"`, context.useStyling)}`,
        )
      }

      if (typeof propValue === "string" && context.checkTranslations) {
        try {
          validate(parseMessage(propValue))
        } catch (err) {
          if (err instanceof MessageError) {
            return TypeError(
              `invalid translation string at key ${keyColor(
                `"${key}"`,
                context.useStyling,
              )}: ${err.message} in message ${json(propValue, context.useStyling)}`,
            )
          }
        }

        if (context.checkTranslations.matchParametersInKeys) {
          const expectedParams = extractParameterTypeNamesFromMessage(key)
          const actualParams = extractParameterTypeNamesFromMessage(propValue)

          if (!extendsParameterTypes(expectedParams, actualParams)) {
            return TypeError(
              `parameter types in translation string at key ${keyColor(
                `"${key}"`,
                context.useStyling,
              )} do not match the expected parameter types. Expected: ${json(
                expectedParams,
                context.useStyling,
              )} Actual: ${json(actualParams, context.useStyling)}`,
            )
          }
        }
      }

      if (propType !== null && propValue !== undefined) {
        return wrapErrorsIfAny(
          `at translation object key ${keyColor(`"${key}"`, context.useStyling)}`,
          validateRecursively(context, allKeysAreRequired, propType, propValue),
        )
      }

      return undefined
    }),
  ])
}

export const validateTranslationObjectType: Validator<TranslationObjectType> = (
  helpers,
  _inDecls,
  type,
  value,
) => validateRecursively(helpers, type.allKeysAreRequired, type.properties, value)

export const resolveTypeArgumentsInTranslationObjectType: TypeArgumentsResolver<
  TranslationObjectType
> = (_args, type, _inDecl) => type

export const serializeTranslationObjectType = <P extends TConstraint>(
  type: TranslationObjectType<P>,
): Serialized<TranslationObjectType<P>> => type as SerializedTranslationObjectType<P>

export const getReferencesForTranslationObjectType: GetReferences<TranslationObjectType> = () => []

const formatRecursively = (type: TConstraint, value: unknown): unknown =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? sortObjectKeys(
        Object.fromEntries(
          Object.entries(value).map(([key, item]) => [
            key,
            type[key] ? formatRecursively(type[key], item) : item,
          ]),
        ),
        Object.keys(type),
      )
    : value

export const formatTranslationObjectValue: StructureFormatter<TranslationObjectType> = (
  type,
  value,
) => formatRecursively(type.properties, value)

export const getTypeOfKey = <T extends TConstraint>(
  keyValue: null | T,
  parentType?: TranslationObjectType,
): StringType | TranslationObjectType<T> =>
  keyValue === null
    ? { kind: "StringType" }
    : {
        kind: "TranslationObjectType",
        allKeysAreRequired: false,
        ...parentType,
        properties: keyValue,
      }

export const checkCustomConstraintsInTranslationObjectType: CustomConstraintValidator<
  TranslationObjectType
> = () => []
