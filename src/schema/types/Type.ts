import { assertExhaustive } from "../../utils/typeSafety.js"
import { Decl, isDecl } from "../declarations/Declaration.js"
import { BaseNode, GetReferences, NodeKind, Serializer } from "../Node.js"
import { Validator } from "../validation/type.js"
import {
  ArrayType,
  getReferencesForArrayType,
  resolveTypeArgumentsInArrayType,
  serializeArrayType,
  SerializedArrayType,
  validateArrayType,
} from "./generic/ArrayType.js"
import {
  getReferencesForObjectType,
  MemberDecl,
  ObjectType,
  resolveTypeArgumentsInObjectType,
  SerializedObjectType,
  serializeObjectType,
  validateObjectType,
} from "./generic/ObjectType.js"
import {
  BooleanType,
  getReferencesForBooleanType,
  serializeBooleanType,
  validateBooleanType,
} from "./primitives/BooleanType.js"
import {
  getReferencesForDateType,
  serializeDateType,
  validateDateType,
} from "./primitives/DateType.js"
import {
  FloatType,
  getReferencesForFloatType,
  serializeFloatType,
  validateFloatType,
} from "./primitives/FloatType.js"
import {
  getReferencesForIntegerType,
  serializeIntegerType,
  validateIntegerType,
} from "./primitives/IntegerType.js"
import { PrimitiveType, SerializedPrimitiveType } from "./primitives/PrimitiveType.js"
import {
  getReferencesForStringType,
  serializeStringType,
  StringType,
  validateStringType,
} from "./primitives/StringType.js"
import {
  GenericArgumentIdentifierType,
  getReferencesForGenericArgumentIdentifierType,
  resolveTypeArgumentsInGenericArgumentIdentifierType,
  SerializedGenericArgumentIdentifierType,
  serializeGenericArgumentIdentifierType,
  validateGenericArgumentIdentifierType,
} from "./references/GenericArgumentIdentifierType.js"
import {
  getReferencesForIncludeIdentifierType,
  IncludeIdentifierType,
  resolveTypeArgumentsInIncludeIdentifierType,
  SerializedIncludeIdentifierType,
  serializeIncludeIdentifierType,
  validateIncludeIdentifierType,
} from "./references/IncludeIdentifierType.js"
import {
  getReferencesForNestedEntityMapType,
  NestedEntityMapType,
  resolveTypeArgumentsInNestedEntityMapType,
  SerializedNestedEntityMapType,
  serializeNestedEntityMapType,
  validateNestedEntityMapType,
} from "./references/NestedEntityMapType.js"
import {
  getReferencesForReferenceIdentifierType,
  ReferenceIdentifierType,
  resolveTypeArgumentsInReferenceIdentifierType,
  SerializedReferenceIdentifierType,
  serializeReferenceIdentifierType,
  validateReferenceIdentifierType,
} from "./references/ReferenceIdentifierType.js"

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
  | GenericArgumentIdentifierType
  | ReferenceIdentifierType
  | IncludeIdentifierType
  | NestedEntityMapType

export type SerializedType =
  | SerializedPrimitiveType
  | SerializedArrayType
  | SerializedObjectType
  | SerializedGenericArgumentIdentifierType
  | SerializedReferenceIdentifierType
  | SerializedIncludeIdentifierType
  | SerializedNestedEntityMapType

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
    case NodeKind.GenericArgumentIdentifierType:
      return validateGenericArgumentIdentifierType(helpers, type, value)
    case NodeKind.ReferenceIdentifierType:
      return validateReferenceIdentifierType(helpers, type, value)
    case NodeKind.IncludeIdentifierType:
      return validateIncludeIdentifierType(helpers, type, value)
    case NodeKind.NestedEntityMapType:
      return validateNestedEntityMapType(helpers, type, value)
    default:
      return assertExhaustive(type)
  }
}

export const resolveTypeArgumentsInType = <Args extends Record<string, Type>>(
  args: Args,
  type: Type,
): Type => {
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
    case NodeKind.GenericArgumentIdentifierType:
      return resolveTypeArgumentsInGenericArgumentIdentifierType(args, type)
    case NodeKind.ReferenceIdentifierType:
      return resolveTypeArgumentsInReferenceIdentifierType(args, type)
    case NodeKind.IncludeIdentifierType:
      return resolveTypeArgumentsInIncludeIdentifierType(args, type)
    case NodeKind.NestedEntityMapType:
      return resolveTypeArgumentsInNestedEntityMapType(args, type)
    default:
      return assertExhaustive(type)
  }
}

export function walkTypeNodeTree(callbackFn: (type: Type) => void, type: Type): void {
  switch (type.kind) {
    case NodeKind.ArrayType:
      callbackFn(type)
      return walkTypeNodeTree(callbackFn, type.items)
    case NodeKind.ObjectType:
      callbackFn(type)
      return Object.values(type.properties).forEach(prop => walkTypeNodeTree(callbackFn, prop.type))
    case NodeKind.NestedEntityMapType:
      callbackFn(type)
      return walkTypeNodeTree(callbackFn, type.type.value)
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.GenericArgumentIdentifierType:
    case NodeKind.ReferenceIdentifierType:
    case NodeKind.IncludeIdentifierType:
      return callbackFn(type)
    default:
      return assertExhaustive(type)
  }
}

export type AsNode<T> = T extends (infer I)[]
  ? ArrayType<AsNode<I>>
  : T extends Record<string, any>
  ? ObjectType<{
      [K in keyof T]: T[K] extends MemberDecl<Type, boolean>
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
    case NodeKind.GenericArgumentIdentifierType:
      return serializeGenericArgumentIdentifierType(type)
    case NodeKind.ReferenceIdentifierType:
      return serializeReferenceIdentifierType(type)
    case NodeKind.IncludeIdentifierType:
      return serializeIncludeIdentifierType(type)
    case NodeKind.NestedEntityMapType:
      return serializeNestedEntityMapType(type)
    default:
      return assertExhaustive(type)
  }
}

export const removeParentKey = <T extends BaseType>(type: T): Omit<T, "parent"> => {
  const { parent: _parent, ...rest } = type
  return rest
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
    case NodeKind.GenericArgumentIdentifierType:
      return getReferencesForGenericArgumentIdentifierType(type, value)
    case NodeKind.ReferenceIdentifierType:
      return getReferencesForReferenceIdentifierType(type, value)
    case NodeKind.IncludeIdentifierType:
      return getReferencesForIncludeIdentifierType(type, value)
    case NodeKind.NestedEntityMapType:
      return getReferencesForNestedEntityMapType(type, value)
    default:
      return assertExhaustive(type)
  }
}
