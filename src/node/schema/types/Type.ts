import { assertExhaustive } from "../../../shared/utils/typeSafety.ts"
import type { BaseNode } from "../Node.ts"
import { NodeKind } from "../Node.ts"
import type { ArrayType } from "./generic/ArrayType.ts"
import { formatArrayValue } from "./generic/ArrayType.ts"
import type { EnumType } from "./generic/EnumType.ts"
import { formatEnumType } from "./generic/EnumType.ts"
import type { MemberDecl, ObjectType } from "./generic/ObjectType.ts"
import { formatObjectValue } from "./generic/ObjectType.ts"
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
import { formatIncludeIdentifierValue } from "./references/IncludeIdentifierType.ts"
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

export function walkTypeNodeTree(callbackFn: (type: Type) => void, type: Type): void {
  switch (type.kind) {
    case NodeKind.ArrayType: {
      callbackFn(type)
      walkTypeNodeTree(callbackFn, type.items)
      return
    }
    case NodeKind.ObjectType: {
      callbackFn(type)
      Object.values(type.properties).forEach(prop => {
        walkTypeNodeTree(callbackFn, prop.type)
      })
      return
    }
    case NodeKind.NestedEntityMapType: {
      callbackFn(type)
      walkTypeNodeTree(callbackFn, type.type.value)
      return
    }
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.TypeArgumentType:
    case NodeKind.ReferenceIdentifierType:
    case NodeKind.ChildEntitiesType: {
      callbackFn(type)
      return
    }
    case NodeKind.IncludeIdentifierType: {
      callbackFn(type)
      type.args.forEach(arg => {
        walkTypeNodeTree(callbackFn, arg)
      })
      return
    }
    case NodeKind.EnumType: {
      callbackFn(type)
      Object.values(type.values).forEach(value => {
        if (value.type) {
          walkTypeNodeTree(callbackFn, value.type)
        }
      })
      return
    }
    default:
      return assertExhaustive(type)
  }
}

export type AsType<T extends Type> =
  T extends ArrayType<infer I>
    ? AsType<I>[]
    : T extends ObjectType<infer P>
      ? {
          [K in keyof P]: P[K] extends MemberDecl<Type, true>
            ? AsType<P[K]["type"]>
            : AsType<P[K]["type"]> | undefined
        }
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
                    : T extends NestedEntityMapType
                      ? unknown
                      : T extends ReferenceIdentifierType
                        ? unknown
                        : T extends ChildEntitiesType
                          ? unknown
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
          : never

export const findTypeAtPath = (type: Type, path: string[]): Type | undefined => {
  const [head, ...tail] = path

  if (head === undefined) {
    return type
  }

  if (type.kind === NodeKind.ObjectType) {
    const prop = type.properties[head]
    if (prop) {
      return findTypeAtPath(prop.type, tail)
    }
  } else if (type.kind === NodeKind.ArrayType && head === "0") {
    return findTypeAtPath(type.items, path)
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
    default:
      return assertExhaustive(type)
  }
}
