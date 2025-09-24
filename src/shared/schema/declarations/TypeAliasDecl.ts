import type { NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
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
> = (decl, args, decls) => ({
  ...decl,
  parameters: [],
  type: resolveTypeArgumentsInSerializedType(
    getSerializedTypeArgumentsRecord(decl, args),
    decl.type,
    decls,
  ),
})

export const getReferencesForSerializedTypeAliasDecl: GetReferencesSerialized<
  SerializedTypeAliasDecl
> = (decl, value, decls) => getReferencesForSerializedType(decl.type, value, decls)
