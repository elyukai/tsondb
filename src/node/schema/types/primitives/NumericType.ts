import type { FloatType, SerializedFloatType } from "./FloatType.ts"
import type { IntegerType, SerializedIntegerType } from "./IntegerType.ts"

export type NumericType = FloatType | IntegerType
export type SerializedNumericType = SerializedFloatType | SerializedIntegerType

export * from "./FloatType.ts"
export * from "./IntegerType.ts"
