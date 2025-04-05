import { enumOfObject } from "../../utils/enum.js"

export const NodeKind = enumOfObject({
  EntityDecl: null,
  EnumDecl: null,
  TypeAliasDecl: null,
  MemberDecl: null,
  ArrayType: null,
  ObjectType: null,
  BooleanType: null,
  FloatType: null,
  IntegerType: null,
  StringType: null,
  GenericArgumentIdentifierType: null,
  GenericParameter: null,
  ReferenceIdentifierType: null,
  IncludeIdentifierType: null,
})
