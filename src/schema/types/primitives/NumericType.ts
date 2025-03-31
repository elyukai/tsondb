import { PrimitiveType } from "./PrimitiveType.js"

export type RangeBound = number | { value: number; isExclusive: boolean }

export class NumericType extends PrimitiveType {
  minimum?: RangeBound
  maximum?: RangeBound
  multipleOf?: number
}
