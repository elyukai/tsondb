import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedTypeParameter } from "../TypeParameter.ts"
import {
  getReferencesForSerializedEnumType,
  resolveTypeArgumentsInSerializedEnumType,
  type SerializedEnumCaseDecl,
  type SerializedEnumType,
} from "../types/EnumType.ts"
import type { SerializedBaseDecl } from "./Declaration.ts"

export interface SerializedEnumDecl<
  Name extends string = string,
  T extends Record<string, SerializedEnumCaseDecl> = Record<string, SerializedEnumCaseDecl>,
  Params extends SerializedTypeParameter[] = SerializedTypeParameter[],
> extends SerializedBaseDecl<Name, Params> {
  kind: NodeKind["EnumDecl"]
  type: SerializedEnumType<T>
  isDeprecated?: boolean
}
export const resolveTypeArgumentsInSerializedEnumDecl: SerializedTypeArgumentsResolver<
  SerializedEnumDecl
> = (decls, args, decl) => {
  return {
    ...decl,
    parameters: [],
    type: resolveTypeArgumentsInSerializedEnumType(decls, args, decl.type),
  }
}

export const getReferencesForSerializedEnumDecl: GetReferencesSerialized<SerializedEnumDecl> = (
  decls,
  decl,
  value,
) => getReferencesForSerializedEnumType(decls, decl.type, value)
