import type { NodeKind } from "../Node.ts"
import type { SerializedTypeParameter } from "../TypeParameter.ts"
import type { SerializedType } from "../types/Type.ts"
import type { SerializedBaseDecl } from "./Declaration.ts"

export interface SerializedTypeAliasDecl<
  Name extends string = string,
  T extends SerializedType = SerializedType,
  Params extends SerializedTypeParameter[] = SerializedTypeParameter[],
> extends SerializedBaseDecl<Name, Params> {
  kind: NodeKind["TypeAliasDecl"]
  type: T
  isDeprecated?: boolean
}
