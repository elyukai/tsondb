import type { BaseNode } from "../Node.ts"
import type { SerializedTypeParameter } from "../TypeParameter.ts"
import type { SerializedEnumCaseDecl } from "../types/EnumType.ts"
import type { SerializedMemberDecl } from "../types/ObjectType.ts"
import { type SerializedType } from "../types/Type.ts"
import type { SerializedEntityDecl } from "./EntityDecl.ts"
import type { SerializedEnumDecl } from "./EnumDecl.ts"
import type { SerializedTypeAliasDecl } from "./TypeAliasDecl.ts"

export type SerializedTypeArguments<Params extends SerializedTypeParameter[]> = {
  [K in keyof Params]: Params[K] extends SerializedTypeParameter<string, infer T>
    ? T
    : SerializedType
}

export const getSerializedTypeArgumentsRecord = <Params extends SerializedTypeParameter[]>(
  decl: SerializedDeclP<Params>,
  args: SerializedTypeArguments<Params>,
): Record<string, SerializedType> =>
  Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    args.slice(0, decl.parameters.length).map((arg, i) => [decl.parameters[i]!.name, arg] as const),
  )

export type SerializedDecl = SerializedEntityDecl | SerializedEnumDecl | SerializedTypeAliasDecl

export type SerializedDeclP<Params extends SerializedTypeParameter[] = SerializedTypeParameter[]> =
  | SerializedEntityDecl
  | SerializedEnumDecl<string, Record<string, SerializedEnumCaseDecl>, Params>
  | SerializedTypeAliasDecl<string, SerializedType, Params>

export type SerializedSecondaryDecl =
  | SerializedEnumDecl
  | SerializedTypeAliasDecl
  | SerializedEntityDecl<string, Record<string, SerializedMemberDecl>, string>

export interface SerializedBaseDecl<
  Name extends string = string,
  Params extends SerializedTypeParameter[] = SerializedTypeParameter[],
> extends BaseNode {
  sourceUrl: string
  name: Name
  comment?: string
  parameters: Params
}
