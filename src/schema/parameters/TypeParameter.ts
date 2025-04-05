import { NodeKind } from "../types/Node.js"
import { Type } from "../types/Type.js"

export interface TypeParameter<N extends string = string, T extends Type = Type> {
  kind: typeof NodeKind.GenericParameter
  name: N
  constraint?: T
}

export const Param = <N extends string = string, T extends Type = Type>(
  name: N,
  constraint?: T,
): TypeParameter<N, T> => ({
  kind: NodeKind.GenericParameter,
  name,
  constraint,
})
