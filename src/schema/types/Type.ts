import { assertExhaustive } from "../../utils/typeSafety.js"
import { EntityDecl } from "../declarations/EntityDeclaration.js"
import { TypeAliasDecl } from "../declarations/TypeAliasDecl.js"
import { TypeParameter } from "../parameters/TypeParameter.js"
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
import { NodeKind } from "./Node.js"
import {
  PrimitiveType,
  validateBooleanType,
  validateFloatType,
  validateIntegerType,
  validateStringType,
} from "./primitives/PrimitiveType.js"
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
  ReferenceIdentifierType,
  replaceTypeArgumentsInReferenceIdentifierType,
  validateReferenceIdentifierType,
} from "./references/ReferenceIdentifierType.js"

export type Type =
  | PrimitiveType
  | ArrayType<Type>
  | ObjectType<Record<string, MemberDecl<Type, boolean>>>
  | GenericArgumentIdentifierType<TypeParameter>
  | ReferenceIdentifierType<
      EntityDecl<
        string,
        ObjectType<Record<string, MemberDecl<Type, boolean>>>,
        string,
        TypeParameter[]
      >
    >
  | IncludeIdentifierType<
      TypeAliasDecl<string, ObjectType<Record<string, MemberDecl<Type, boolean>>>, TypeParameter[]>,
      TypeParameter[]
    >

export const validate = (type: Type, value: unknown): void => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      validateArrayType(type, value)
      break
    case NodeKind.ObjectType:
      validateObjectType(type, value)
      break
    case NodeKind.BooleanType:
      validateBooleanType(type, value)
      break
    case NodeKind.FloatType:
      validateFloatType(type, value)
      break
    case NodeKind.IntegerType:
      validateIntegerType(type, value)
      break
    case NodeKind.StringType:
      validateStringType(type, value)
      break
    case NodeKind.GenericArgumentIdentifierType:
      validateGenericArgumentIdentifierType(type, value)
      break
    case NodeKind.ReferenceIdentifierType:
      validateReferenceIdentifierType(type, value)
      break
    case NodeKind.IncludeIdentifierType:
      validateIncludeIdentifierType(type, value)
      break
    default:
      assertExhaustive(type)
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
    default:
      return assertExhaustive(type)
  }
}
