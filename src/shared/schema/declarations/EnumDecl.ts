import {
  NodeKind,
  type GetReferencesSerialized,
  type SerializedNode,
  type SerializedTypeArgumentsResolver,
} from "../Node.js"
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

export const isSerializedEnumDecl = (node: SerializedNode): node is SerializedEnumDecl =>
  node.kind === NodeKind.EnumDecl

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

export const ENUM_DISCRIMINATOR_KEY = "kind"
export type ENUM_DISCRIMINATOR_KEY = typeof ENUM_DISCRIMINATOR_KEY

export type EnumValue<K extends string, V> = { [ENUM_DISCRIMINATOR_KEY]: K } & { [Key2 in K]: V }

export const createEnumCaseValue = <K extends string, V>(
  caseName: K,
  caseValue: V,
): EnumValue<K, V> =>
  ({
    [ENUM_DISCRIMINATOR_KEY]: caseName,
    [caseName]: caseValue,
  }) as EnumValue<K, V>
