import type { BooleanType, SerializedBooleanType } from "./BooleanType.js"
import type { DateType, SerializedDateType } from "./DateType.js"
import type { NumericType, SerializedNumericType } from "./NumericType.js"
import type { SerializedStringType, StringType } from "./StringType.js"

export type PrimitiveType = BooleanType | DateType | NumericType | StringType

export type SerializedPrimitiveType =
  | SerializedBooleanType
  | SerializedDateType
  | SerializedNumericType
  | SerializedStringType
