import { getAtKeyPath, parseKeyPath, type KeyPath } from "../../../shared/schema/utils/keyPath.ts"
import { error, ok } from "../../../shared/utils/result.ts"
import { assertExhaustive } from "../../../shared/utils/typeSafety.ts"
import {
  isTypeAliasDecl,
  type Decl,
  type EnumDecl,
  type TypeAliasDecl,
  type TypeParameter,
} from "../index.ts"
import type { BaseNode, CustomConstraintValidator } from "../Node.ts"
import { NodeKind } from "../Node.ts"
import type { ArrayType } from "./generic/ArrayType.ts"
import {
  checkCustomConstraintsInArrayType,
  formatArrayValue,
  isArrayType,
} from "./generic/ArrayType.ts"
import type { EnumCaseDecl, EnumType } from "./generic/EnumType.ts"
import { checkCustomConstraintsInEnumType, formatEnumType } from "./generic/EnumType.ts"
import type { MemberDecl, ObjectType } from "./generic/ObjectType.ts"
import {
  checkCustomConstraintsInObjectType,
  formatObjectValue,
  isObjectType,
} from "./generic/ObjectType.ts"
import {
  checkCustomConstraintsInTranslationObjectType,
  formatTranslationObjectValue,
  type TranslationObjectType,
} from "./generic/TranslationObjectType.ts"
import type { BooleanType } from "./primitives/BooleanType.ts"
import {
  checkCustomConstraintsInBooleanType,
  formatBooleanValue,
} from "./primitives/BooleanType.ts"
import type { DateType } from "./primitives/DateType.ts"
import { checkCustomConstraintsInDateType, formatDateValue } from "./primitives/DateType.ts"
import type { FloatType } from "./primitives/FloatType.ts"
import { checkCustomConstraintsInFloatType, formatFloatValue } from "./primitives/FloatType.ts"
import type { IntegerType } from "./primitives/IntegerType.ts"
import {
  checkCustomConstraintsInIntegerType,
  formatIntegerValue,
} from "./primitives/IntegerType.ts"
import type { StringType } from "./primitives/StringType.ts"
import { checkCustomConstraintsInStringType, formatStringValue } from "./primitives/StringType.ts"
import {
  checkCustomConstraintsInChildEntitiesType,
  formatChildEntitiesValue,
  type ChildEntitiesType,
} from "./references/ChildEntitiesType.ts"
import type { IncludeIdentifierType } from "./references/IncludeIdentifierType.ts"
import {
  checkCustomConstraintsInIncludeIdentifierType,
  formatIncludeIdentifierValue,
  isIncludeIdentifierType,
} from "./references/IncludeIdentifierType.ts"
import type { NestedEntityMapType } from "./references/NestedEntityMapType.ts"
import {
  checkCustomConstraintsInNestedEntityMapType,
  formatNestedEntityMapValue,
} from "./references/NestedEntityMapType.ts"
import type { ReferenceIdentifierType } from "./references/ReferenceIdentifierType.ts"
import {
  checkCustomConstraintsInReferenceIdentifierType,
  formatReferenceIdentifierValue,
} from "./references/ReferenceIdentifierType.ts"
import type { TypeArgumentType } from "./references/TypeArgumentType.ts"
import {
  checkCustomConstraintsInTypeArgumentType,
  formatTypeArgumentValue,
} from "./references/TypeArgumentType.ts"

export interface BaseType extends BaseNode {}

export type Type =
  | BooleanType
  | DateType
  | FloatType
  | IntegerType
  | StringType
  | ArrayType
  | ObjectType
  | TypeArgumentType
  | ReferenceIdentifierType
  | IncludeIdentifierType
  | NestedEntityMapType
  | EnumType
  | ChildEntitiesType
  | TranslationObjectType

export function walkTypeNodeTree(
  callbackFn: (type: Type, parentTypes: Type[], parentDecl: Decl) => void,
  type: Type,
  parentTypes: Type[],
  parentDecl: Decl,
): void {
  switch (type.kind) {
    case NodeKind.ArrayType: {
      callbackFn(type, parentTypes, parentDecl)
      walkTypeNodeTree(callbackFn, type.items, [...parentTypes, type], parentDecl)
      return
    }
    case NodeKind.ObjectType: {
      callbackFn(type, parentTypes, parentDecl)
      Object.values(type.properties).forEach(prop => {
        walkTypeNodeTree(callbackFn, prop.type, [...parentTypes, type], parentDecl)
      })
      return
    }
    case NodeKind.NestedEntityMapType: {
      callbackFn(type, parentTypes, parentDecl)
      walkTypeNodeTree(callbackFn, type.type.value, [...parentTypes, type], parentDecl)
      return
    }
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.TypeArgumentType:
    case NodeKind.ReferenceIdentifierType:
    case NodeKind.ChildEntitiesType:
    case NodeKind.TranslationObjectType: {
      callbackFn(type, parentTypes, parentDecl)
      return
    }
    case NodeKind.IncludeIdentifierType: {
      callbackFn(type, parentTypes, parentDecl)
      type.args.forEach(arg => {
        walkTypeNodeTree(callbackFn, arg, [...parentTypes, type], parentDecl)
      })
      return
    }
    case NodeKind.EnumType: {
      callbackFn(type, parentTypes, parentDecl)
      Object.values(type.values).forEach(value => {
        if (value.type) {
          walkTypeNodeTree(callbackFn, value.type, [...parentTypes, type], parentDecl)
        }
      })
      return
    }
    default:
      return assertExhaustive(type)
  }
}

type EnumCaseTypeAsType<Case extends string, T extends Type | null> = T extends object
  ? { kind: Case } & { [AV in Case]: AsType<T> }
  : { kind: Case }

type EnumCaseTypeAsDeepType<Case extends string, T extends Type | null> = T extends object
  ? { kind: Case } & { [AV in Case]: AsDeepType<T> }
  : { kind: Case }

type MemberDeclsAsType<P extends Record<string, MemberDecl>> = {
  [K in keyof P]: P[K] extends MemberDecl<Type, true>
    ? AsType<P[K]["type"]>
    : AsType<P[K]["type"]> | undefined
}

type MemberDeclsAsDeepType<P extends Record<string, MemberDecl>> = {
  [K in keyof P]: P[K] extends MemberDecl<Type, true>
    ? AsDeepType<P[K]["type"]>
    : AsDeepType<P[K]["type"]> | undefined
}

export type AsDeepType<T extends Type> =
  T extends ArrayType<infer I>
    ? AsDeepType<I>[]
    : T extends ObjectType<infer P>
      ? MemberDeclsAsDeepType<P>
      : T extends BooleanType
        ? boolean
        : T extends DateType
          ? Date
          : T extends FloatType
            ? number
            : T extends IntegerType
              ? number
              : T extends StringType
                ? string
                : T extends TypeArgumentType
                  ? unknown
                  : T extends IncludeIdentifierType<TypeParameter[], infer Decl>
                    ? Decl extends TypeAliasDecl<string, infer TA>
                      ? AsDeepType<TA>
                      : Decl extends EnumDecl<string, infer EC>
                        ? AsDeepType<EnumType<EC>>
                        : unknown
                    : T extends NestedEntityMapType<string, infer TC>
                      ? { [id: string]: MemberDeclsAsDeepType<TC> }
                      : T extends ReferenceIdentifierType
                        ? string
                        : T extends ChildEntitiesType
                          ? never
                          : T extends EnumType<infer EC>
                            ? EC extends Record<string, EnumCaseDecl>
                              ? {
                                  [Case in keyof EC]: EnumCaseTypeAsDeepType<
                                    Case & string,
                                    EC[Case]["type"]
                                  >
                                }[keyof EC]
                              : never
                            : never

export type AsType<T extends Type> =
  T extends ArrayType<infer I>
    ? AsType<I>[]
    : T extends ObjectType<infer P>
      ? MemberDeclsAsType<P>
      : T extends BooleanType
        ? boolean
        : T extends DateType
          ? Date
          : T extends FloatType
            ? number
            : T extends IntegerType
              ? number
              : T extends StringType
                ? string
                : T extends TypeArgumentType
                  ? unknown
                  : T extends IncludeIdentifierType
                    ? unknown
                    : T extends NestedEntityMapType<string, infer TC>
                      ? { [id: string]: MemberDeclsAsType<TC> }
                      : T extends ReferenceIdentifierType
                        ? string
                        : T extends ChildEntitiesType
                          ? string[]
                          : T extends EnumType<infer EC>
                            ? EC extends Record<string, EnumCaseDecl>
                              ? {
                                  [Case in keyof EC]: EnumCaseTypeAsType<
                                    Case & string,
                                    EC[Case]["type"]
                                  >
                                }[keyof EC]
                              : never
                            : never

export type AsNode<T> = T extends (infer I)[]
  ? ArrayType<AsNode<I>>
  : T extends Record<string, unknown>
    ? ObjectType<{
        [K in keyof T]: T[K] extends MemberDecl
          ? T[K]
          : T extends null | undefined
            ? MemberDecl<AsNode<NonNullable<T[K]>>, false>
            : MemberDecl<AsNode<T[K]>, true>
      }>
    : T extends string
      ? StringType
      : T extends number
        ? FloatType
        : T extends boolean
          ? BooleanType
          : T extends Date
            ? DateType
            : never

export const findTypeAtPath = (
  type: Type,
  path: KeyPath,
  options: { followTypeAliasIncludes?: boolean; throwOnPathMismatch?: boolean } = {},
): Type =>
  getAtKeyPath<Type>(
    type,
    [],
    parseKeyPath(path),
    options.throwOnPathMismatch ?? false,
    type =>
      isArrayType(type)
        ? ok(type.items)
        : error(previousPath => `Key path "${previousPath}" does not contain an array type.`),
    (type, name) => {
      if (isObjectType(type)) {
        const prop = type.properties[name]
        if (prop) {
          return ok(prop.type)
        } else {
          return error(
            previousPath =>
              `Object type at key path "${previousPath}" does not contain the property ${name}.`,
          )
        }
      } else {
        return error(previousPath => `Key path "${previousPath}" does not contain an object type.`)
      }
    },
    // recursively resolves type aliases in includes as this is automatically
    // called recursively if needed
    type =>
      isIncludeIdentifierType(type) &&
      options.followTypeAliasIncludes &&
      isTypeAliasDecl(type.reference)
        ? ok([type.reference.type.value, true])
        : error(),
  )

/**
 * Format the structure of a value to always look the same when serialized as JSON.
 */
export type StructureFormatter<T extends Type> = (type: T, value: unknown) => unknown

export const formatValue: StructureFormatter<Type> = (type, value) => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return formatArrayValue(type, value)
    case NodeKind.ObjectType:
      return formatObjectValue(type, value)
    case NodeKind.BooleanType:
      return formatBooleanValue(type, value)
    case NodeKind.DateType:
      return formatDateValue(type, value)
    case NodeKind.FloatType:
      return formatFloatValue(type, value)
    case NodeKind.IntegerType:
      return formatIntegerValue(type, value)
    case NodeKind.StringType:
      return formatStringValue(type, value)
    case NodeKind.TypeArgumentType:
      return formatTypeArgumentValue(type, value)
    case NodeKind.IncludeIdentifierType:
      return formatIncludeIdentifierValue(type, value)
    case NodeKind.NestedEntityMapType:
      return formatNestedEntityMapValue(type, value)
    case NodeKind.ReferenceIdentifierType:
      return formatReferenceIdentifierValue(type, value)
    case NodeKind.EnumType:
      return formatEnumType(type, value)
    case NodeKind.ChildEntitiesType:
      return formatChildEntitiesValue(type, value)
    case NodeKind.TranslationObjectType:
      return formatTranslationObjectValue(type, value)
    default:
      return assertExhaustive(type)
  }
}

export const checkCustomConstraintsInType: CustomConstraintValidator<Type> = (
  type,
  value,
  helpers,
) => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return checkCustomConstraintsInArrayType(type, value, helpers)
    case NodeKind.ObjectType:
      return checkCustomConstraintsInObjectType(type, value, helpers)
    case NodeKind.BooleanType:
      return checkCustomConstraintsInBooleanType(type, value, helpers)
    case NodeKind.DateType:
      return checkCustomConstraintsInDateType(type, value, helpers)
    case NodeKind.FloatType:
      return checkCustomConstraintsInFloatType(type, value, helpers)
    case NodeKind.IntegerType:
      return checkCustomConstraintsInIntegerType(type, value, helpers)
    case NodeKind.StringType:
      return checkCustomConstraintsInStringType(type, value, helpers)
    case NodeKind.TypeArgumentType:
      return checkCustomConstraintsInTypeArgumentType(type, value, helpers)
    case NodeKind.IncludeIdentifierType:
      return checkCustomConstraintsInIncludeIdentifierType(type, value, helpers)
    case NodeKind.NestedEntityMapType:
      return checkCustomConstraintsInNestedEntityMapType(type, value, helpers)
    case NodeKind.ReferenceIdentifierType:
      return checkCustomConstraintsInReferenceIdentifierType(type, value, helpers)
    case NodeKind.EnumType:
      return checkCustomConstraintsInEnumType(type, value, helpers)
    case NodeKind.ChildEntitiesType:
      return checkCustomConstraintsInChildEntitiesType(type, value, helpers)
    case NodeKind.TranslationObjectType:
      return checkCustomConstraintsInTranslationObjectType(type, value, helpers)
    default:
      return assertExhaustive(type)
  }
}
