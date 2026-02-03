import { NodeKind } from "../../../shared/schema/Node.ts"
import type { Type } from "./types/Type.ts"

export interface TypeParameter<N extends string = string, T extends Type = Type> {
  kind: NodeKind["TypeParameter"]
  name: N
  constraint?: T
}

export const TypeParameter = <N extends string = string, T extends Type = Type>(
  name: N,
  constraint?: T,
): TypeParameter<N, T> => ({
  kind: NodeKind.TypeParameter,
  name,
  constraint,
})

export { TypeParameter as Param }
