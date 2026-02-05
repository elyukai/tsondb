import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { MessageError, parseMessage, validate } from "messageformat"
import { ENUM_DISCRIMINATOR_KEY } from "../../../shared/schema/declarations/EnumDecl.ts"
import { NodeKind } from "../../../shared/schema/Node.ts"
import {
  extendsParameterTypes,
  extractParameterTypeNamesFromMessage,
} from "../../../shared/utils/translation.ts"
import { parallelizeErrors } from "../../../shared/utils/validation.ts"
import { validateArrayConstraints } from "../../../shared/validation/array.ts"
import { validateDateConstraints } from "../../../shared/validation/date.ts"
import { validateNumberConstraints } from "../../../shared/validation/number.ts"
import {
  validateObjectConstraints,
  validateObjectRangeConstraints,
  validateUnknownKeys,
} from "../../../shared/validation/object.ts"
import { validateStringConstraints } from "../../../shared/validation/string.ts"
import type { ValidationOptions } from "../../index.ts"
import { type DatabaseInMemory } from "../../utils/databaseInMemory.ts"
import { wrapErrorsIfAny } from "../../utils/error.ts"
import { entity, json, key } from "../../utils/errorFormatting.ts"
import { getTypeArgumentsRecord, type Decl } from "../dsl/declarations/Decl.ts"
import { createEntityIdentifierType } from "../dsl/declarations/EntityDecl.ts"
import type { Type } from "../dsl/index.ts"
import type { TranslationObjectTypeConstraint } from "../dsl/types/TranslationObjectType.ts"
import type { AnyEntityMap } from "../generatedTypeHelpers.ts"
import { isChildEntitiesType } from "../guards.ts"
import { resolveTypeArguments } from "./typeResolution.ts"

export type IdentifierToCheck = { name: string; value: unknown }

export type ReferenceValidator = (entityName: string, instanceId: unknown) => ReferenceError[]

export interface ValidationContext {
  useStyling: boolean
  validationOptions: ValidationOptions
}

export const createReferenceValidator =
  <EM extends AnyEntityMap>(
    isEntityName: (name: string) => name is Extract<keyof EM, string>,
    databaseInMemory: DatabaseInMemory<EM>,
    useStyling: boolean,
  ): ReferenceValidator =>
  (entityName, instanceId) =>
    isEntityName(entityName)
      ? typeof instanceId === "string" &&
        databaseInMemory.hasInstanceOfEntityById(entityName, instanceId)
        ? []
        : [
            ReferenceError(
              `Invalid reference to instance of entity ${entity(`"${entityName}"`, useStyling)} with identifier ${json(
                instanceId,
                useStyling,
              )}`,
            ),
          ]
      : [
          ReferenceError(
            `Invalid reference to entity ${entity(`"${entityName}"`, useStyling)}, entity does not exist`,
          ),
        ]

export const validateDeclStructuralIntegrity = (
  helpers: ValidationContext,
  inDecls: Decl[],
  decl: Decl,
  typeArgs: Type[],
  value: unknown,
): TypeError[] => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return validateTypeStructuralIntegrity(helpers, inDecls, decl.type.value, value)
    case NodeKind.EnumDecl:
    case NodeKind.TypeAliasDecl:
      return validateTypeStructuralIntegrity(
        helpers,
        [...inDecls, decl],
        resolveTypeArguments(getTypeArgumentsRecord(decl, typeArgs), decl.type.value, [
          ...inDecls,
          decl,
        ]),
        value,
      )
    default:
      return assertExhaustive(decl)
  }
}

const validateTranslationObjectStructuralIntegrity = (
  context: ValidationContext,
  allKeysAreRequired: boolean,
  type: TranslationObjectTypeConstraint,
  value: unknown,
): TypeError[] => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`expected an object, but got ${json(value, context.useStyling)}`)]
  }

  const expectedKeys = Object.keys(type).filter(key => type[key] !== undefined)

  return parallelizeErrors([
    ...validateUnknownKeys(expectedKeys, Object.keys(value)),
    ...expectedKeys.map(propName => {
      const propType = type[propName] as TranslationObjectTypeConstraint | null
      const propValue = (value as Record<string, unknown>)[propName]

      if (allKeysAreRequired && propValue === undefined) {
        return TypeError(`missing required translation ${key(`"${propName}"`, context.useStyling)}`)
      }

      if (propType === null && propValue !== undefined && typeof propValue !== "string") {
        return TypeError(
          `expected a string at translation key ${key(`"${propName}"`, context.useStyling)}, but got ${json(
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
          `expected a non-empty string at translation key ${key(`"${propName}"`, context.useStyling)}`,
        )
      }

      if (typeof propValue === "string" && context.validationOptions.checkTranslations) {
        try {
          validate(parseMessage(propValue))
        } catch (err) {
          if (err instanceof MessageError) {
            return TypeError(
              `invalid translation string at key ${key(
                `"${propName}"`,
                context.useStyling,
              )}: ${err.message} in message ${json(propValue, context.useStyling)}`,
            )
          }
        }

        if (context.validationOptions.checkTranslations.matchParametersInKeys) {
          const expectedParams = extractParameterTypeNamesFromMessage(propName)
          const actualParams = extractParameterTypeNamesFromMessage(propValue)

          if (!extendsParameterTypes(expectedParams, actualParams)) {
            return TypeError(
              `parameter types in translation string at key ${key(
                `"${propName}"`,
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
          `at translation object key ${key(`"${propName}"`, context.useStyling)}`,
          validateTranslationObjectStructuralIntegrity(
            context,
            allKeysAreRequired,
            propType,
            propValue,
          ),
        )
      }

      return undefined
    }),
  ])
}

export const validateTypeStructuralIntegrity = (
  helpers: ValidationContext,
  inDecls: Decl[],
  type: Type,
  value: unknown,
): TypeError[] => {
  switch (type.kind) {
    case NodeKind.ArrayType: {
      if (!Array.isArray(value)) {
        return [TypeError(`expected an array, but got ${json(value, helpers.useStyling)}`)]
      }

      return parallelizeErrors([
        ...validateArrayConstraints(type, value),
        ...value.map((item, index) =>
          wrapErrorsIfAny(
            `at index ${key(index.toString(), helpers.useStyling)}`,
            validateTypeStructuralIntegrity(helpers, inDecls, type.items, item),
          ),
        ),
      ])
    }
    case NodeKind.ObjectType: {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return [TypeError(`expected an object, but got ${json(value, helpers.useStyling)}`)]
      }

      const expectedKeys = Object.keys(type.properties).filter(
        propName =>
          type.properties[propName] !== undefined &&
          !isChildEntitiesType(type.properties[propName].type),
      )

      return parallelizeErrors([
        ...validateObjectConstraints(type, expectedKeys, value),
        ...expectedKeys.map(propName => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const prop = type.properties[propName]!

          if (prop.isRequired && !(propName in value)) {
            return TypeError(
              `missing required property ${key(`"${propName}"`, helpers.useStyling)}`,
            )
          } else if (
            prop.isRequired ||
            (value as Record<string, unknown>)[propName] !== undefined
          ) {
            return wrapErrorsIfAny(
              `at object key ${key(`"${propName}"`, helpers.useStyling)}`,
              validateTypeStructuralIntegrity(
                helpers,
                inDecls,
                prop.type,
                (value as Record<string, unknown>)[propName],
              ),
            )
          }

          return undefined
        }),
      ])
    }
    case NodeKind.BooleanType: {
      if (typeof value !== "boolean") {
        return [TypeError(`expected a boolean value, but got ${json(value, helpers.useStyling)}`)]
      }

      return []
    }
    case NodeKind.DateType: {
      if (typeof value !== "string") {
        return [TypeError(`expected a string, but got ${json(value, helpers.useStyling)}`)]
      }

      return validateDateConstraints(type, value)
    }
    case NodeKind.FloatType: {
      if (typeof value !== "number") {
        return [
          TypeError(`expected a floating-point number, but got ${json(value, helpers.useStyling)}`),
        ]
      }

      return validateNumberConstraints(type, value)
    }
    case NodeKind.IntegerType: {
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return [TypeError(`expected an integer, but got ${json(value, helpers.useStyling)}`)]
      }

      return validateNumberConstraints(type, value)
    }
    case NodeKind.StringType: {
      if (typeof value !== "string") {
        return [TypeError(`expected a string, but got ${json(value, helpers.useStyling)}`)]
      }

      return validateStringConstraints(type, value)
    }
    case NodeKind.TypeArgumentType: {
      throw new TypeError(
        `generic argument "${type.argument.name}" has not been replaced with a concrete type`,
      )
    }
    case NodeKind.ReferenceIdentifierType:
      return validateTypeStructuralIntegrity(helpers, inDecls, createEntityIdentifierType(), value)
    case NodeKind.IncludeIdentifierType:
      return validateDeclStructuralIntegrity(helpers, inDecls, type.reference, type.args, value)
    case NodeKind.NestedEntityMapType: {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return [TypeError(`expected an object, but got ${json(value, helpers.useStyling)}`)]
      }

      return parallelizeErrors([
        ...validateObjectRangeConstraints(type, value),
        ...Object.keys(value).map(propName =>
          wrapErrorsIfAny(
            `at nested entity map ${entity(`"${type.name}"`, helpers.useStyling)} at key ${key(`"${propName}"`, helpers.useStyling)}`,
            validateTypeStructuralIntegrity(
              helpers,
              inDecls,
              type.type.value,
              value[propName as keyof typeof value],
            ),
          ),
        ),
      ])
    }
    case NodeKind.EnumType: {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return [TypeError(`expected an object, but got ${json(value, helpers.useStyling)}`)]
      }

      const actualKeys = Object.keys(value)

      if (!(ENUM_DISCRIMINATOR_KEY in value) || typeof value[ENUM_DISCRIMINATOR_KEY] !== "string") {
        return [
          TypeError(
            `missing required discriminator value at key ${key(`"${ENUM_DISCRIMINATOR_KEY}"`, helpers.useStyling)} of type string`,
          ),
        ]
      }

      const caseName = value[ENUM_DISCRIMINATOR_KEY]

      if (!(caseName in type.values)) {
        return [
          TypeError(
            `discriminator ${key(`"${caseName}"`, helpers.useStyling)} is not a valid enum case, possible cases are: ${Object.keys(type.values).join(", ")}`,
          ),
        ]
      }

      const unknownKeyErrors = actualKeys.flatMap(actualKey =>
        actualKey === ENUM_DISCRIMINATOR_KEY || actualKey in type.values
          ? []
          : [
              TypeError(
                `key ${key(`"${actualKey}"`, helpers.useStyling)} is not the discriminator key ${key(`"${caseName}"`, helpers.useStyling)} or a valid enum case, possible cases are: ${Object.keys(type.values).join(", ")}`,
              ),
            ],
      )

      if (unknownKeyErrors.length > 0) {
        return unknownKeyErrors
      }

      const associatedType = type.values[caseName]?.type

      if (associatedType != null) {
        if (!(caseName in value)) {
          return [
            TypeError(
              `missing required associated value for case ${key(`"${caseName}"`, helpers.useStyling)}`,
            ),
          ]
        }

        return parallelizeErrors([
          wrapErrorsIfAny(
            `at enum case ${key(`"${caseName}"`, helpers.useStyling)}`,
            validateTypeStructuralIntegrity(
              helpers,
              inDecls,
              associatedType,
              (value as Record<typeof caseName, unknown>)[caseName],
            ),
          ),
        ])
      }

      return []
    }
    case NodeKind.ChildEntitiesType:
      return []
    case NodeKind.TranslationObjectType:
      return validateTranslationObjectStructuralIntegrity(
        helpers,
        type.allKeysAreRequired,
        type.properties,
        value,
      )
    default:
      return assertExhaustive(type)
  }
}

export const validateDeclReferentialIntegrity = (
  helpers: ValidationContext,
  checkReferentialIntegrity: ReferenceValidator,
  inDecls: Decl[],
  decl: Decl,
  typeArgs: Type[],
  value: unknown,
): ReferenceError[] => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return validateTypeReferentialIntegrity(
        helpers,
        checkReferentialIntegrity,
        inDecls,
        decl.type.value,
        value,
      )
    case NodeKind.EnumDecl:
    case NodeKind.TypeAliasDecl:
      return validateTypeReferentialIntegrity(
        helpers,
        checkReferentialIntegrity,
        [...inDecls, decl],
        resolveTypeArguments(getTypeArgumentsRecord(decl, typeArgs), decl.type.value, [
          ...inDecls,
          decl,
        ]),
        value,
      )
    default:
      return assertExhaustive(decl)
  }
}

export const validateTypeReferentialIntegrity = (
  helpers: ValidationContext,
  checkReferentialIntegrity: ReferenceValidator,
  inDecls: Decl[],
  type: Type,
  value: unknown,
): ReferenceError[] => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return Array.isArray(value)
        ? parallelizeErrors(
            value.map((item, index) =>
              wrapErrorsIfAny(
                `at index ${key(index.toString(), helpers.useStyling)}`,
                validateTypeReferentialIntegrity(
                  helpers,
                  checkReferentialIntegrity,
                  inDecls,
                  type.items,
                  item,
                ),
              ),
            ),
          )
        : []
    case NodeKind.ObjectType: {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return []
      }

      const expectedKeys = Object.keys(type.properties).filter(
        propName =>
          type.properties[propName] !== undefined &&
          !isChildEntitiesType(type.properties[propName].type),
      )

      return parallelizeErrors(
        expectedKeys.map(propName => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const prop = type.properties[propName]!

          if ((value as Record<string, unknown>)[propName] !== undefined) {
            return wrapErrorsIfAny(
              `at object key ${key(`"${propName}"`, helpers.useStyling)}`,
              validateTypeReferentialIntegrity(
                helpers,
                checkReferentialIntegrity,
                inDecls,
                prop.type,
                (value as Record<string, unknown>)[propName],
              ),
            )
          }

          return undefined
        }),
      )
    }
    case NodeKind.TypeArgumentType: {
      throw new TypeError(
        `generic argument "${type.argument.name}" has not been replaced with a concrete type`,
      )
    }
    case NodeKind.ReferenceIdentifierType:
      return checkReferentialIntegrity(type.entity.name, value)
    case NodeKind.IncludeIdentifierType:
      return validateDeclReferentialIntegrity(
        helpers,
        checkReferentialIntegrity,
        inDecls,
        type.reference,
        type.args,
        value,
      )
    case NodeKind.NestedEntityMapType: {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return []
      }

      return parallelizeErrors(
        Object.keys(value).map(propName =>
          wrapErrorsIfAny(
            `at nested entity map ${entity(`"${type.name}"`, helpers.useStyling)} at key ${key(`"${propName}"`, helpers.useStyling)}`,
            validateTypeReferentialIntegrity(
              helpers,
              checkReferentialIntegrity,
              inDecls,
              type.type.value,
              value[propName as keyof typeof value],
            ).concat(checkReferentialIntegrity(type.secondaryEntity.name, propName)),
          ),
        ),
      )
    }
    case NodeKind.EnumType: {
      if (
        typeof value !== "object" ||
        value === null ||
        Array.isArray(value) ||
        !(ENUM_DISCRIMINATOR_KEY in value)
      ) {
        return []
      }

      const enumCase = value[ENUM_DISCRIMINATOR_KEY]

      return typeof enumCase === "string" &&
        enumCase in type.values &&
        type.values[enumCase] !== undefined &&
        type.values[enumCase].type !== null &&
        enumCase in value
        ? parallelizeErrors([
            wrapErrorsIfAny(
              `at enum case ${key(`"${enumCase}"`, helpers.useStyling)}`,
              validateTypeReferentialIntegrity(
                helpers,
                checkReferentialIntegrity,
                inDecls,
                type.values[enumCase].type,
                (value as Record<typeof enumCase, unknown>)[enumCase],
              ),
            ),
          ])
        : []
    }
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.ChildEntitiesType:
    case NodeKind.TranslationObjectType:
      return []
    default:
      return assertExhaustive(type)
  }
}
