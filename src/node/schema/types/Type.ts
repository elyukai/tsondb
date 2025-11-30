import { assertExhaustive } from "../../../shared/utils/typeSafety.ts"
import {
  isTypeAliasDecl,
  type Decl,
  type EnumDecl,
  type TypeAliasDecl,
  type TypeParameter,
} from "../index.ts"
import type { BaseNode } from "../Node.ts"
import { NodeKind } from "../Node.ts"
import type { ArrayType } from "./generic/ArrayType.ts"
import { formatArrayValue, isArrayType } from "./generic/ArrayType.ts"
import type { EnumCaseDecl, EnumType } from "./generic/EnumType.ts"
import { formatEnumType } from "./generic/EnumType.ts"
import type { MemberDecl, ObjectType } from "./generic/ObjectType.ts"
import { formatObjectValue, isObjectType } from "./generic/ObjectType.ts"
import {
  formatTranslationObjectValue,
  type TranslationObjectType,
} from "./generic/TranslationObjectType.ts"
import type { BooleanType } from "./primitives/BooleanType.ts"
import { formatBooleanValue } from "./primitives/BooleanType.ts"
import type { DateType } from "./primitives/DateType.ts"
import { formatDateValue } from "./primitives/DateType.ts"
import type { FloatType } from "./primitives/FloatType.ts"
import { formatFloatValue } from "./primitives/FloatType.ts"
import type { IntegerType } from "./primitives/IntegerType.ts"
import { formatIntegerValue } from "./primitives/IntegerType.ts"
import type { StringType } from "./primitives/StringType.ts"
import { formatStringValue } from "./primitives/StringType.ts"
import { formatChildEntitiesValue, type ChildEntitiesType } from "./references/ChildEntitiesType.ts"
import type { IncludeIdentifierType } from "./references/IncludeIdentifierType.ts"
import {
  formatIncludeIdentifierValue,
  isIncludeIdentifierType,
} from "./references/IncludeIdentifierType.ts"
import type { NestedEntityMapType } from "./references/NestedEntityMapType.ts"
import { formatNestedEntityMapValue } from "./references/NestedEntityMapType.ts"
import type { ReferenceIdentifierType } from "./references/ReferenceIdentifierType.ts"
import { formatReferenceIdentifierValue } from "./references/ReferenceIdentifierType.ts"
import type { TypeArgumentType } from "./references/TypeArgumentType.ts"
import { formatTypeArgumentValue } from "./references/TypeArgumentType.ts"

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
    : // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- it does make a difference here
      AsDeepType<P[K]["type"]> | undefined
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
  path: string[],
  options: { followTypeAliasIncludes?: boolean } = {},
): Type | undefined => {
  const [head, ...tail] = path

  if (head === undefined) {
    return type
  }

  if (isObjectType(type)) {
    const prop = type.properties[head]
    if (prop) {
      return findTypeAtPath(prop.type, tail, options)
    }
  } else if (isArrayType(type) && head === "0") {
    return findTypeAtPath(type.items, path, options)
  } else if (
    isIncludeIdentifierType(type) &&
    options.followTypeAliasIncludes &&
    isTypeAliasDecl(type.reference)
  ) {
    return findTypeAtPath(type.reference.type.value, path, options)
  }

  return undefined
}

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
