import { assertExhaustive } from "../../utils/typeSafety.js"
import { Decl, isDecl } from "../declarations/Declaration.js"
import { BaseNode, NodeKind } from "../Node.js"
import { Validator } from "../validation/type.js"
import {
  ArrayType,
  replaceTypeArgumentsInArrayType,
  validateArrayType,
} from "./generic/ArrayType.js"
import {
  MemberDecl,
  ObjectType,
  replaceTypeArgumentsInObjectType,
  validateObjectType,
} from "./generic/ObjectType.js"
import { BooleanType, validateBooleanType } from "./primitives/BooleanType.js"
import { FloatType, validateFloatType } from "./primitives/FloatType.js"
import { validateIntegerType } from "./primitives/IntegerType.js"
import { PrimitiveType } from "./primitives/PrimitiveType.js"
import { StringType, validateStringType } from "./primitives/StringType.js"
import {
  GenericArgumentIdentifierType,
  replaceTypeArgumentsInGenericArgumentIdentifierType,
  validateGenericArgumentIdentifierType,
} from "./references/GenericArgumentIdentifierType.js"
import {
  IncludeIdentifierType,
  replaceTypeArgumentsInIncludeIdentifierType,
  validateIncludeIdentifierType,
} from "./references/IncludeIdentifierType.js"
import {
  NestedEntityMapType,
  replaceTypeArgumentsInNestedEntityMapType,
  validateNestedEntityMapType,
} from "./references/NestedEntityMapType.js"
import {
  ReferenceIdentifierType,
  replaceTypeArgumentsInReferenceIdentifierType,
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

export const replaceTypeArguments = <Args extends Record<string, Type>>(
  args: Args,
  type: Type,
): Type => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return replaceTypeArgumentsInArrayType(args, type)
    case NodeKind.ObjectType:
      return replaceTypeArgumentsInObjectType(args, type)
    case NodeKind.BooleanType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
      return type
    case NodeKind.GenericArgumentIdentifierType:
      return replaceTypeArgumentsInGenericArgumentIdentifierType(args, type)
    case NodeKind.ReferenceIdentifierType:
      return replaceTypeArgumentsInReferenceIdentifierType(args, type)
    case NodeKind.IncludeIdentifierType:
      return replaceTypeArgumentsInIncludeIdentifierType(args, type)
    case NodeKind.NestedEntityMapType:
      return replaceTypeArgumentsInNestedEntityMapType(args, type)
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
