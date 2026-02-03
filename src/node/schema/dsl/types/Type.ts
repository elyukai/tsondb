import type { BaseNode } from "../../../../shared/schema/Node.ts"
import type { ArrayType } from "./ArrayType.ts"
import type { BooleanType } from "./BooleanType.ts"
import type { ChildEntitiesType } from "./ChildEntitiesType.ts"
import type { DateType } from "./DateType.ts"
import type { EnumType } from "./EnumType.ts"
import type { FloatType } from "./FloatType.ts"
import type { IncludeIdentifierType } from "./IncludeIdentifierType.ts"
import type { IntegerType } from "./IntegerType.ts"
import type { NestedEntityMapType } from "./NestedEntityMapType.ts"
import type { ObjectType } from "./ObjectType.ts"
import type { ReferenceIdentifierType } from "./ReferenceIdentifierType.ts"
import type { StringType } from "./StringType.ts"
import type { TranslationObjectType } from "./TranslationObjectType.ts"
import type { TypeArgumentType } from "./TypeArgumentType.ts"

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
  | TranslationObjectType
