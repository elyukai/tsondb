import { assertExhaustive } from "../../../shared/utils/typeSafety.ts"
import type { Decl } from "../declarations/Declaration.ts"
import { isDecl } from "../declarations/Declaration.ts"
import type { BaseNode, GetReferences, Serializer } from "../Node.ts"
import { NodeKind } from "../Node.ts"
import type { Validator } from "../validation/type.ts"
import type { ArrayType, SerializedArrayType } from "./generic/ArrayType.ts"
import {
  formatArrayValue,
  getReferencesForArrayType,
  resolveTypeArgumentsInArrayType,
  serializeArrayType,
  validateArrayType,
} from "./generic/ArrayType.ts"
import type { EnumType, SerializedEnumType } from "./generic/EnumType.ts"
import {
  formatEnumType,
  getReferencesForEnumType,
  resolveTypeArgumentsInEnumType,
  serializeEnumType,
  validateEnumType,
} from "./generic/EnumType.ts"
import type {
  MemberDecl,
  ObjectType,
  SerializedMemberDecl,
  SerializedObjectType,
} from "./generic/ObjectType.ts"
import {
  formatObjectValue,
  getReferencesForObjectType,
  resolveTypeArgumentsInObjectType,
  serializeObjectType,
  validateObjectType,
} from "./generic/ObjectType.ts"
import type { BooleanType, SerializedBooleanType } from "./primitives/BooleanType.ts"
import {
  formatBooleanValue,
  getReferencesForBooleanType,
  serializeBooleanType,
  validateBooleanType,
} from "./primitives/BooleanType.ts"
import type { DateType, SerializedDateType } from "./primitives/DateType.ts"
import {
  formatDateValue,
  getReferencesForDateType,
  serializeDateType,
  validateDateType,
} from "./primitives/DateType.ts"
import type { FloatType, SerializedFloatType } from "./primitives/FloatType.ts"
import {
  formatFloatValue,
  getReferencesForFloatType,
  serializeFloatType,
  validateFloatType,
} from "./primitives/FloatType.ts"
import type { IntegerType, SerializedIntegerType } from "./primitives/IntegerType.ts"
import {
  formatIntegerValue,
  getReferencesForIntegerType,
  serializeIntegerType,
  validateIntegerType,
} from "./primitives/IntegerType.ts"
import type { PrimitiveType, SerializedPrimitiveType } from "./primitives/PrimitiveType.ts"
import type { SerializedStringType, StringType } from "./primitives/StringType.ts"
import {
  formatStringValue,
  getReferencesForStringType,
  serializeStringType,
  validateStringType,
} from "./primitives/StringType.ts"
import type {
  IncludeIdentifierType,
  SerializedIncludeIdentifierType,
} from "./references/IncludeIdentifierType.ts"
import {
  formatIncludeIdentifierValue,
  getReferencesForIncludeIdentifierType,
  resolveTypeArgumentsInIncludeIdentifierType,
  serializeIncludeIdentifierType,
  validateIncludeIdentifierType,
} from "./references/IncludeIdentifierType.ts"
import type {
  NestedEntityMapType,
  SerializedNestedEntityMapType,
} from "./references/NestedEntityMapType.ts"
import {
  formatNestedEntityMapValue,
  getReferencesForNestedEntityMapType,
  resolveTypeArgumentsInNestedEntityMapType,
  serializeNestedEntityMapType,
  validateNestedEntityMapType,
} from "./references/NestedEntityMapType.ts"
import type {
  ReferenceIdentifierType,
  SerializedReferenceIdentifierType,
} from "./references/ReferenceIdentifierType.ts"
import {
  formatReferenceIdentifierValue,
  getReferencesForReferenceIdentifierType,
  resolveTypeArgumentsInReferenceIdentifierType,
  serializeReferenceIdentifierType,
  validateReferenceIdentifierType,
} from "./references/ReferenceIdentifierType.ts"
import type { SerializedTypeArgumentType, TypeArgumentType } from "./references/TypeArgumentType.ts"
import {
  formatTypeArgumentValue,
  getReferencesForTypeArgumentType,
  resolveTypeArgumentsInTypeArgumentType,
  serializeTypeArgumentType,
  validateTypeArgumentType,
} from "./references/TypeArgumentType.ts"

export interface BaseType extends BaseNode {
  /**
   * The parent node of this type will be set when the type is used in a declaration or nested in another type.
   */
  parent?: Type | Decl
}

export interface SerializedBaseType extends BaseNode {}

export type Type =
  | PrimitiveType
  | ArrayType
  | ObjectType
  | TypeArgumentType
  | ReferenceIdentifierType
  | IncludeIdentifierType
  | NestedEntityMapType
  | EnumType

export type SerializedType =
  | SerializedPrimitiveType
  | SerializedArrayType
  | SerializedObjectType
  | SerializedTypeArgumentType
  | SerializedReferenceIdentifierType
  | SerializedIncludeIdentifierType
  | SerializedNestedEntityMapType
  | SerializedEnumType

export const validate: Validator<Type> = (helpers, type, value) => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return validateArrayType(helpers, type, value)
    case NodeKind.ObjectType:
      return validateObjectType(helpers, type, value)
    case NodeKind.BooleanType:
      return validateBooleanType(helpers, type, value)
    case NodeKind.DateType:
      return validateDateType(helpers, type, value)
    case NodeKind.FloatType:
      return validateFloatType(helpers, type, value)
    case NodeKind.IntegerType:
      return validateIntegerType(helpers, type, value)
    case NodeKind.StringType:
      return validateStringType(helpers, type, value)
    case NodeKind.TypeArgumentType:
      return validateTypeArgumentType(helpers, type, value)
    case NodeKind.ReferenceIdentifierType:
      return validateReferenceIdentifierType(helpers, type, value)
    case NodeKind.IncludeIdentifierType:
      return validateIncludeIdentifierType(helpers, type, value)
    case NodeKind.NestedEntityMapType:
      return validateNestedEntityMapType(helpers, type, value)
    case NodeKind.EnumType:
      return validateEnumType(helpers, type, value)
    default:
      return assertExhaustive(type)
  }
}

export const resolveTypeArgumentsInType = (args: Record<string, Type>, type: Type): Type => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return resolveTypeArgumentsInArrayType(args, type)
    case NodeKind.ObjectType:
      return resolveTypeArgumentsInObjectType(args, type)
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
      return type
    case NodeKind.TypeArgumentType:
      return resolveTypeArgumentsInTypeArgumentType(args, type)
    case NodeKind.ReferenceIdentifierType:
      return resolveTypeArgumentsInReferenceIdentifierType(args, type)
    case NodeKind.IncludeIdentifierType:
      return resolveTypeArgumentsInIncludeIdentifierType(args, type)
    case NodeKind.NestedEntityMapType:
      return resolveTypeArgumentsInNestedEntityMapType(args, type)
    case NodeKind.EnumType:
      return resolveTypeArgumentsInEnumType(args, type)
    default:
      return assertExhaustive(type)
  }
}

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
    case NodeKind.ReferenceIdentifierType: {
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
                        : never

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

export const getParentDecl = (type: Type): Decl | undefined => {
  if (type.parent === undefined) {
    return undefined
  } else if (isDecl(type.parent)) {
    return type.parent
  } else {
    return getParentDecl(type.parent)
  }
}

/**
 * Sets the `parent` property of the passed `type` to the passed `parentNode`.
 *
 * The property is set on the instance. It does not create a new instance.
 */
export const setParent = <T extends BaseType>(
  type: Omit<T, "parent">,
  parentNode: Type | Decl,
): T => {
  ;(type as T).parent = parentNode
  return type as T
}

export const removeParentKey = <T extends BaseType>(type: T): Omit<T, "parent"> => {
  const { parent: _parent, ...rest } = type
  return rest
}

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

export const serializeType: Serializer<Type, SerializedType> = type => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return serializeArrayType(type)
    case NodeKind.ObjectType:
      return serializeObjectType(type)
    case NodeKind.BooleanType:
      return serializeBooleanType(type)
    case NodeKind.DateType:
      return serializeDateType(type)
    case NodeKind.FloatType:
      return serializeFloatType(type)
    case NodeKind.IntegerType:
      return serializeIntegerType(type)
    case NodeKind.StringType:
      return serializeStringType(type)
    case NodeKind.TypeArgumentType:
      return serializeTypeArgumentType(type)
    case NodeKind.ReferenceIdentifierType:
      return serializeReferenceIdentifierType(type)
    case NodeKind.IncludeIdentifierType:
      return serializeIncludeIdentifierType(type)
    case NodeKind.NestedEntityMapType:
      return serializeNestedEntityMapType(type)
    case NodeKind.EnumType:
      return serializeEnumType(type)
    default:
      return assertExhaustive(type)
  }
}

export const getReferencesForType: GetReferences<Type> = (type, value) => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return getReferencesForArrayType(type, value)
    case NodeKind.ObjectType:
      return getReferencesForObjectType(type, value)
    case NodeKind.BooleanType:
      return getReferencesForBooleanType(type, value)
    case NodeKind.DateType:
      return getReferencesForDateType(type, value)
    case NodeKind.FloatType:
      return getReferencesForFloatType(type, value)
    case NodeKind.IntegerType:
      return getReferencesForIntegerType(type, value)
    case NodeKind.StringType:
      return getReferencesForStringType(type, value)
    case NodeKind.TypeArgumentType:
      return getReferencesForTypeArgumentType(type, value)
    case NodeKind.ReferenceIdentifierType:
      return getReferencesForReferenceIdentifierType(type, value)
    case NodeKind.IncludeIdentifierType:
      return getReferencesForIncludeIdentifierType(type, value)
    case NodeKind.NestedEntityMapType:
      return getReferencesForNestedEntityMapType(type, value)
    case NodeKind.EnumType:
      return getReferencesForEnumType(type, value)
    default:
      return assertExhaustive(type)
  }
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
    default:
      return assertExhaustive(type)
  }
}
