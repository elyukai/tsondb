import type { TypeParameter } from "./TypeParameter.ts"
import type { Decl } from "./declarations/Decl.ts"
import type { Type } from "./types/Type.ts"

export {
  type Decl,
  type DeclP,
  type IncludableDeclP,
  type SecondaryDecl,
} from "./declarations/Decl.ts"
export {
  Entity,
  EntityDecl,
  type EntityDeclWithParentReference,
  type EntityDisplayName,
  type GenericEntityDisplayName,
} from "./declarations/EntityDecl.ts"
export { Enum, EnumDecl, GenEnum, GenEnumDecl } from "./declarations/EnumDecl.ts"
export {
  GenTypeAlias,
  GenTypeAliasDecl,
  TypeAlias,
  TypeAliasDecl,
} from "./declarations/TypeAliasDecl.ts"
export { Array, ArrayType } from "./types/ArrayType.ts"
export { Boolean, BooleanType } from "./types/BooleanType.ts"
export { ChildEntities, ChildEntitiesType } from "./types/ChildEntitiesType.ts"
export { Date, DateType } from "./types/DateType.ts"
export { Float, FloatType } from "./types/FloatType.ts"
export {
  GenIncludeIdentifier,
  GenIncludeIdentifierType,
  IncludeIdentifier,
  IncludeIdentifierType,
} from "./types/IncludeIdentifierType.ts"
export { Integer, IntegerType } from "./types/IntegerType.ts"
export { NestedEntityMap, NestedEntityMapType } from "./types/NestedEntityMapType.ts"
export { Object, ObjectType, Optional, Required } from "./types/ObjectType.ts"
export { ReferenceIdentifier, ReferenceIdentifierType } from "./types/ReferenceIdentifierType.ts"
export { String, StringType } from "./types/StringType.ts"
export { TranslationObject, TranslationObjectType } from "./types/TranslationObjectType.ts"
export type { Type } from "./types/Type.ts"
export { TypeArgument, TypeArgumentType } from "./types/TypeArgumentType.ts"

export type Node = Decl | Type | TypeParameter
