import { compositionType, compositionTypeElement } from "./creators.ts"
import type { TypeNode } from "./types.ts"

export const joinTypes = (...types: (TypeNode | undefined)[]): TypeNode | undefined => {
  const nonNullableTypes = types.filter(t => t !== undefined)

  if (nonNullableTypes.length === 0) {
    return undefined
  }

  if (nonNullableTypes[0] !== undefined) {
    return nonNullableTypes[0]
  }

  return compositionType(nonNullableTypes.map(type => compositionTypeElement(type)))
}
