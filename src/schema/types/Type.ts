import { assertExhaustive } from "../../utils/typeSafety.js"
import { Decl, isDecl } from "../declarations/Declaration.js"
import { BaseNode, NodeKind } from "../Node.js"
import { Validator } from "../validation/type.js"
import {
  ArrayType,
  resolveTypeArgumentsInArrayType,
  validateArrayType,
} from "./generic/ArrayType.js"
import {
  MemberDecl,
  ObjectType,
  resolveTypeArgumentsInObjectType,
  validateObjectType,
} from "./generic/ObjectType.js"
import { BooleanType, validateBooleanType } from "./primitives/BooleanType.js"
import { validateDateType } from "./primitives/DateType.js"
import { FloatType, validateFloatType } from "./primitives/FloatType.js"
import { validateIntegerType } from "./primitives/IntegerType.js"
import { PrimitiveType } from "./primitives/PrimitiveType.js"
import { StringType, validateStringType } from "./primitives/StringType.js"
import {
  GenericArgumentIdentifierType,
  resolveTypeArgumentsInGenericArgumentIdentifierType,
  validateGenericArgumentIdentifierType,
} from "./references/GenericArgumentIdentifierType.js"
import {
  IncludeIdentifierType,
  resolveTypeArgumentsInIncludeIdentifierType,
  validateIncludeIdentifierType,
} from "./references/IncludeIdentifierType.js"
import {
  NestedEntityMapType,
  resolveTypeArgumentsInNestedEntityMapType,
  validateNestedEntityMapType,
} from "./references/NestedEntityMapType.js"
import {
  ReferenceIdentifierType,
  resolveTypeArgumentsInReferenceIdentifierType,
  validateReferenceIdentifierType,
} from "./references/ReferenceIdentifierType.js"

export interface BaseType extends BaseNode {
  /**
   * The parent node of this type will be set when the type is used in a declaration or nested in another type.
   */
  parent?: Type | Decl
}

export type Type =
  | PrimitiveType
  | ArrayType
  | ObjectType
  | GenericArgumentIdentifierType
  | ReferenceIdentifierType
  | IncludeIdentifierType
  | NestedEntityMapType

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
