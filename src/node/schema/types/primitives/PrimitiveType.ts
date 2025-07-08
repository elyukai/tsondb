import { BooleanType, SerializedBooleanType } from "./BooleanType.js"
import { DateType, SerializedDateType } from "./DateType.js"
import { NumericType, SerializedNumericType } from "./NumericType.js"
import { SerializedStringType, StringType } from "./StringType.js"

export type PrimitiveType = BooleanType | DateType | NumericType | StringType

export type SerializedPrimitiveType =
  | SerializedBooleanType
  | SerializedDateType
  | SerializedNumericType
  | SerializedStringType
