import {
  getReferencesSerialized,
  resolveSerializedTypeArguments,
  type GetReferencesSerialized,
  type NodeKind,
  type SerializedTypeArgumentsResolver,
} from "../Node.ts"
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

export const resolveTypeArgumentsInSerializedTypeAliasDecl: SerializedTypeArgumentsResolver<
  SerializedTypeAliasDecl
> = (decls, args, decl) => ({
  ...decl,
  parameters: [],
  type: resolveSerializedTypeArguments(decls, args, decl.type),
})

export const getReferencesForSerializedTypeAliasDecl: GetReferencesSerialized<
  SerializedTypeAliasDecl
> = (decls, decl, value) => getReferencesSerialized(decls, decl.type, value)
