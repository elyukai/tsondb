import type { BaseNode } from "../Node.ts"
import type { SerializedTypeParameter } from "../TypeParameter.ts"
import type { SerializedEnumCaseDecl } from "../types/EnumType.ts"
import { type SerializedType } from "../types/Type.ts"
import type { SerializedEntityDecl } from "./EntityDecl.ts"
import type { SerializedEnumDecl } from "./EnumDecl.ts"
import type { SerializedTypeAliasDecl } from "./TypeAliasDecl.ts"

export type SerializedTypeArguments<Params extends SerializedTypeParameter[]> = {
  [K in keyof Params]: Params[K] extends SerializedTypeParameter<string, infer T>
    ? T
    : SerializedType
}

export type SerializedDecl = SerializedEntityDecl | SerializedEnumDecl | SerializedTypeAliasDecl

export type SerializedDeclP<Params extends SerializedTypeParameter[] = SerializedTypeParameter[]> =
  | SerializedEntityDecl
  | SerializedEnumDecl<string, Record<string, SerializedEnumCaseDecl>, Params>
  | SerializedTypeAliasDecl<string, SerializedType, Params>

export type SerializedSecondaryDecl = SerializedEnumDecl | SerializedTypeAliasDecl

export interface SerializedBaseDecl<
  Name extends string = string,
  Params extends SerializedTypeParameter[] = SerializedTypeParameter[],
> extends BaseNode {
  sourceUrl: string
  name: Name
  comment?: string
  parameters: Params
}
