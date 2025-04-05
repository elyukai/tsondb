import { NodeKind } from "../Node.js"
import { Type } from "../Type.js"

export interface BooleanType {
  kind: typeof NodeKind.BooleanType
}

export const Boolean = (): BooleanType => ({
  kind: NodeKind.BooleanType,
})

export const isBooleanType = (type: Type): type is BooleanType => type.kind === NodeKind.BooleanType

export const validateBooleanType = (_typeDefinition: BooleanType, value: unknown): void => {
  if (typeof value !== "boolean") {
    throw new TypeError(`Expected a boolean value, but got ${JSON.stringify(value)}`)
  }
}
