import { PrimitiveType } from "./PrimitiveType.js"

export type RangeBound = number | { value: number; isExclusive: boolean }

export abstract class NumericType extends PrimitiveType {
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}
