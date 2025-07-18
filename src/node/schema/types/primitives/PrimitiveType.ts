import type { BooleanType, SerializedBooleanType } from "./BooleanType.ts"
import type { DateType, SerializedDateType } from "./DateType.ts"
import type { NumericType, SerializedNumericType } from "./NumericType.ts"
import type { SerializedStringType, StringType } from "./StringType.ts"

export type PrimitiveType = BooleanType | DateType | NumericType | StringType

export type SerializedPrimitiveType =
  | SerializedBooleanType
  | SerializedDateType
  | SerializedNumericType
  | SerializedStringType
