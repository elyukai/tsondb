import { FloatType } from "./FloatType.js"
import { IntegerType } from "./IntegerType.js"

export type RangeBound = number | { value: number; isExclusive: boolean }

export type NumericType = FloatType | IntegerType

export * from "./FloatType.js"
export * from "./IntegerType.js"
