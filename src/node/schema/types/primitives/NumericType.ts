import type { FloatType, SerializedFloatType } from "./FloatType.js"
import type { IntegerType, SerializedIntegerType } from "./IntegerType.js"

export type NumericType = FloatType | IntegerType
export type SerializedNumericType = SerializedFloatType | SerializedIntegerType

export * from "./FloatType.js"
export * from "./IntegerType.js"
