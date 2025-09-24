import { enumOfObject } from "../utils/enum.ts"
import type { SerializedDecl } from "./declarations/Declaration.ts"
import type { SerializedType } from "./types/Type.ts"

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
})

export interface BaseNode {
  kind: (typeof NodeKind)[keyof typeof NodeKind]
}

export type SerializedNode = SerializedDecl | SerializedType
