export type ComparisonOperator = (a: number, b: number) => boolean

export const lt: ComparisonOperator = (a, b) => a < b
export const lte: ComparisonOperator = (a, b) => a <= b
export const gt: ComparisonOperator = (a, b) => a > b
export const gte: ComparisonOperator = (a, b) => a >= b
export const eq: ComparisonOperator = (a, b) => a === b
export const neq: ComparisonOperator = (a, b) => a !== b
