import { enumOfObject } from "../utils/enum.ts"
import { assertExhaustive } from "../utils/typeSafety.ts"
import type { SerializedDecl } from "./declarations/Declaration.ts"
import {
  getReferencesForSerializedEntityDecl,
  resolveTypeArgumentsInSerializedEntityDecl,
  type SerializedEntityDecl,
} from "./declarations/EntityDecl.ts"
import {
  getReferencesForSerializedEnumDecl,
  resolveTypeArgumentsInSerializedEnumDecl,
  type SerializedEnumDecl,
} from "./declarations/EnumDecl.ts"
import {
  getReferencesForSerializedTypeAliasDecl,
  resolveTypeArgumentsInSerializedTypeAliasDecl,
  type SerializedTypeAliasDecl,
} from "./declarations/TypeAliasDecl.ts"
import {
  getReferencesForSerializedTypeParameter,
  resolveTypeArgumentsInSerializedTypeParameter,
  type SerializedTypeParameter,
} from "./TypeParameter.ts"
import {
  getReferencesForSerializedArrayType,
  resolveTypeArgumentsInSerializedArrayType,
  type SerializedArrayType,
} from "./types/ArrayType.ts"
import {
  getReferencesForSerializedBooleanType,
  resolveTypeArgumentsInSerializedBooleanType,
  type SerializedBooleanType,
} from "./types/BooleanType.ts"
import {
  getReferencesForSerializedChildEntitiesType,
  resolveTypeArgumentsInSerializedChildEntitiesType,
  type SerializedChildEntitiesType,
} from "./types/ChildEntitiesType.ts"
import {
  getReferencesForSerializedDateType,
  resolveTypeArgumentsInSerializedDateType,
  type SerializedDateType,
} from "./types/DateType.ts"
import {
  getReferencesForSerializedEnumType,
  resolveTypeArgumentsInSerializedEnumType,
  type SerializedEnumCaseDecl,
  type SerializedEnumType,
} from "./types/EnumType.ts"
import {
  getReferencesForSerializedFloatType,
  resolveTypeArgumentsInSerializedFloatType,
  type SerializedFloatType,
} from "./types/FloatType.ts"
import {
  getReferencesForSerializedIncludeIdentifierType,
  resolveTypeArgumentsInSerializedIncludeIdentifierType,
  type SerializedIncludeIdentifierType,
} from "./types/IncludeIdentifierType.ts"
import {
  getReferencesForSerializedIntegerType,
  resolveTypeArgumentsInSerializedIntegerType,
  type SerializedIntegerType,
} from "./types/IntegerType.ts"
import {
  getReferencesForSerializedNestedEntityMapType,
  resolveTypeArgumentsInSerializedNestedEntityMapType,
  type SerializedNestedEntityMapType,
} from "./types/NestedEntityMapType.ts"
import {
  getReferencesForSerializedObjectType,
  resolveTypeArgumentsInSerializedObjectType,
  type SerializedMemberDecl,
  type SerializedObjectType,
} from "./types/ObjectType.ts"
import {
  getReferencesForSerializedReferenceIdentifierType,
  resolveTypeArgumentsInSerializedReferenceIdentifierType,
  type SerializedReferenceIdentifierType,
} from "./types/ReferenceIdentifierType.ts"
import {
  getReferencesForSerializedStringType,
  resolveTypeArgumentsInSerializedStringType,
  type SerializedStringType,
} from "./types/StringType.ts"
import type { SerializedType } from "./types/Type.ts"
import {
  getReferencesForSerializedTypeArgumentType,
  resolveTypeArgumentsInSerializedTypeArgumentType,
  type SerializedTypeArgumentType,
} from "./types/TypeArgumentType.ts"

export interface NodeKind {
  EntityDecl: "EntityDecl"
  EnumDecl: "EnumDecl"
  EnumCaseDecl: "EnumCaseDecl"
  TypeAliasDecl: "TypeAliasDecl"
  MemberDecl: "MemberDecl"
  ArrayType: "ArrayType"
  ObjectType: "ObjectType"
  BooleanType: "BooleanType"
  FloatType: "FloatType"
  IntegerType: "IntegerType"
  StringType: "StringType"
  DateType: "DateType"
  TypeArgumentType: "TypeArgumentType"
  TypeParameter: "TypeParameter"
  ReferenceIdentifierType: "ReferenceIdentifierType"
  IncludeIdentifierType: "IncludeIdentifierType"
  NestedEntityMapType: "NestedEntityMapType"
  EnumType: "EnumType"
  ChildEntitiesType: "ChildEntitiesType"
}

export const NodeKind: NodeKind = enumOfObject({
  EntityDecl: null,
  EnumDecl: null,
  EnumCaseDecl: null,
  TypeAliasDecl: null,
  MemberDecl: null,
  ArrayType: null,
  ObjectType: null,
  BooleanType: null,
  FloatType: null,
  IntegerType: null,
  StringType: null,
  DateType: null,
  TypeArgumentType: null,
  TypeParameter: null,
  ReferenceIdentifierType: null,
  IncludeIdentifierType: null,
  NestedEntityMapType: null,
  EnumType: null,
  ChildEntitiesType: null,
})

export interface BaseNode {
  kind: (typeof NodeKind)[keyof typeof NodeKind]
}

export type SerializedNode = SerializedDecl | SerializedType | SerializedTypeParameter

export type SerializedNodeWithResolvedTypeArguments<T extends SerializedNode | null> = T extends
  | SerializedBooleanType
  | SerializedDateType
  | SerializedFloatType
  | SerializedIntegerType
  | SerializedStringType
  | SerializedReferenceIdentifierType
  ? T
  : T extends SerializedEntityDecl<infer N, infer V>
    ? SerializedEntityDecl<N, SerializedNodeWithResolvedTypeArguments<V>>
    : T extends SerializedEnumDecl<infer N, infer V, SerializedTypeParameter[]>
      ? SerializedEnumDecl<
          N,
          {
            [K in keyof V]: V[K] extends SerializedEnumCaseDecl<infer CT>
              ? SerializedEnumCaseDecl<SerializedNodeWithResolvedTypeArguments<CT>>
              : never
          },
          []
        >
      : T extends SerializedTypeAliasDecl<infer N, infer U, SerializedTypeParameter[]>
        ? SerializedTypeAliasDecl<N, SerializedNodeWithResolvedTypeArguments<U>, []>
        : T extends SerializedArrayType<infer I>
          ? SerializedArrayType<SerializedNodeWithResolvedTypeArguments<I>>
          : T extends SerializedEnumType<infer V>
            ? SerializedEnumType<{
                [K in keyof V]: V[K] extends SerializedEnumCaseDecl<infer CT>
                  ? SerializedEnumCaseDecl<SerializedNodeWithResolvedTypeArguments<CT>>
                  : never
              }>
            : T extends SerializedObjectType<infer P>
              ? SerializedObjectType<{
                  [K in keyof P]: P[K] extends SerializedMemberDecl<infer PT, infer R>
                    ? SerializedMemberDecl<SerializedNodeWithResolvedTypeArguments<PT>, R>
                    : never
                }>
              : T extends SerializedTypeArgumentType
                ? SerializedType
                : T extends SerializedIncludeIdentifierType<[]>
                  ? T
                  : T extends SerializedIncludeIdentifierType
                    ? SerializedType
                    : T extends SerializedNestedEntityMapType<infer N, infer P>
                      ? SerializedNestedEntityMapType<
                          N,
                          {
                            [K in keyof P]: P[K] extends SerializedMemberDecl<infer PT, infer R>
                              ? SerializedMemberDecl<SerializedNodeWithResolvedTypeArguments<PT>, R>
                              : never
                          }
                        >
                      : T extends SerializedTypeParameter<infer N, infer C>
                        ? SerializedTypeParameter<N, SerializedNodeWithResolvedTypeArguments<C>>
                        : T extends SerializedChildEntitiesType
                          ? SerializedChildEntitiesType
                          : T extends null
                            ? null
                            : never

export type SerializedTypeArgumentsResolver<T extends SerializedNode = SerializedNode> = (
  decls: Record<string, SerializedDecl>,
  args: Record<string, SerializedType>,
  node: T,
) => SerializedNodeWithResolvedTypeArguments<T>

export const resolveSerializedTypeArguments = <T extends SerializedNode = SerializedNode>(
  decls: Record<string, SerializedDecl>,
  args: Record<string, SerializedType>,
  node: T,
): SerializedNodeWithResolvedTypeArguments<T> => {
  type NT = SerializedNodeWithResolvedTypeArguments<T>

  switch (node.kind) {
    case NodeKind.EntityDecl:
      return resolveTypeArgumentsInSerializedEntityDecl(decls, args, node) as NT
    case NodeKind.EnumDecl:
      return resolveTypeArgumentsInSerializedEnumDecl(decls, args, node) as NT
    case NodeKind.TypeAliasDecl:
      return resolveTypeArgumentsInSerializedTypeAliasDecl(decls, args, node) as NT
    case NodeKind.ArrayType:
      return resolveTypeArgumentsInSerializedArrayType(decls, args, node) as NT
    case NodeKind.ObjectType:
      return resolveTypeArgumentsInSerializedObjectType(decls, args, node) as NT
    case NodeKind.BooleanType:
      return resolveTypeArgumentsInSerializedBooleanType(decls, args, node) as NT
    case NodeKind.DateType:
      return resolveTypeArgumentsInSerializedDateType(decls, args, node) as NT
    case NodeKind.FloatType:
      return resolveTypeArgumentsInSerializedFloatType(decls, args, node) as NT
    case NodeKind.IntegerType:
      return resolveTypeArgumentsInSerializedIntegerType(decls, args, node) as NT
    case NodeKind.StringType:
      return resolveTypeArgumentsInSerializedStringType(decls, args, node) as NT
    case NodeKind.TypeArgumentType:
      return resolveTypeArgumentsInSerializedTypeArgumentType(decls, args, node) as NT
    case NodeKind.ReferenceIdentifierType:
      return resolveTypeArgumentsInSerializedReferenceIdentifierType(decls, args, node) as NT
    case NodeKind.IncludeIdentifierType:
      return resolveTypeArgumentsInSerializedIncludeIdentifierType(decls, args, node) as NT
    case NodeKind.NestedEntityMapType:
      return resolveTypeArgumentsInSerializedNestedEntityMapType(decls, args, node) as NT
    case NodeKind.EnumType:
      return resolveTypeArgumentsInSerializedEnumType(decls, args, node) as NT
    case NodeKind.TypeParameter:
      return resolveTypeArgumentsInSerializedTypeParameter(decls, args, node) as NT
    case NodeKind.ChildEntitiesType:
      return resolveTypeArgumentsInSerializedChildEntitiesType(decls, args, node) as NT
    default:
      return assertExhaustive(node)
  }
}

export type GetReferencesSerialized<T extends SerializedNode = SerializedNode> = (
  decls: Record<string, SerializedDecl>,
  node: T,
  value: unknown,
) => string[]

export const getReferencesSerialized: GetReferencesSerialized = (decls, node, value) => {
  switch (node.kind) {
    case NodeKind.EntityDecl:
      return getReferencesForSerializedEntityDecl(decls, node, value)
    case NodeKind.EnumDecl:
      return getReferencesForSerializedEnumDecl(decls, node, value)
    case NodeKind.TypeAliasDecl:
      return getReferencesForSerializedTypeAliasDecl(decls, node, value)
    case NodeKind.ArrayType:
      return getReferencesForSerializedArrayType(decls, node, value)
    case NodeKind.ObjectType:
      return getReferencesForSerializedObjectType(decls, node, value)
    case NodeKind.BooleanType:
      return getReferencesForSerializedBooleanType(decls, node, value)
    case NodeKind.DateType:
      return getReferencesForSerializedDateType(decls, node, value)
    case NodeKind.FloatType:
      return getReferencesForSerializedFloatType(decls, node, value)
    case NodeKind.IntegerType:
      return getReferencesForSerializedIntegerType(decls, node, value)
    case NodeKind.StringType:
      return getReferencesForSerializedStringType(decls, node, value)
    case NodeKind.TypeArgumentType:
      return getReferencesForSerializedTypeArgumentType(decls, node, value)
    case NodeKind.ReferenceIdentifierType:
      return getReferencesForSerializedReferenceIdentifierType(decls, node, value)
    case NodeKind.IncludeIdentifierType:
      return getReferencesForSerializedIncludeIdentifierType(decls, node, value)
    case NodeKind.NestedEntityMapType:
      return getReferencesForSerializedNestedEntityMapType(decls, node, value)
    case NodeKind.EnumType:
      return getReferencesForSerializedEnumType(decls, node, value)
    case NodeKind.TypeParameter:
      return getReferencesForSerializedTypeParameter(decls, node, value)
    case NodeKind.ChildEntitiesType:
      return getReferencesForSerializedChildEntitiesType(decls, node, value)
    default:
      return assertExhaustive(node)
  }
}

export const getDecl = (decls: Record<string, SerializedDecl>, name: string) => {
  const decl = decls[name]

  if (!decl) {
    throw new Error(`Declaration not found: ${name}`)
  }

  return decl
}
