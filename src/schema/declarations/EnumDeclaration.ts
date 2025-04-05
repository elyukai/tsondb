import { TypeParameter } from "../parameters/TypeParameter.js"
import { NodeKind } from "../types/Node.js"
import { Type } from "../types/Type.js"
import { Decl } from "./Declaration.js"

export interface EnumDecl<Name extends string, Params extends TypeParameter[]> {
  kind: typeof NodeKind.EnumDecl
  sourceUrl: string
  name: Name
  comment?: string
  parameters: Params
  values: (...args: Params) => string[]
}

export const Enum = <Name extends string, Params extends TypeParameter[]>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    parameters: Params
    values: (...args: Params) => string[]
  },
): EnumDecl<Name, Params> => ({
  kind: NodeKind.EnumDecl,
  sourceUrl,
  ...options,
})

export const isEnumDecl = (decl: Decl): decl is EnumDecl<string, TypeParameter[]> =>
  decl.kind === NodeKind.EnumDecl

export const getNestedDeclarationsInEnumDecl = (
  _decl: EnumDecl<string, TypeParameter[]>,
): Decl[] => []

export const validateEnumDecl = (
  _decl: EnumDecl<string, TypeParameter[]>,
  _value: unknown,
): void => {}

export const replaceTypeArgumentsInEnumDecl = <Args extends Record<string, Type>>(
  _args: Args,
  decl: EnumDecl<string, TypeParameter[]>,
): EnumDecl<string, TypeParameter[]> => decl
