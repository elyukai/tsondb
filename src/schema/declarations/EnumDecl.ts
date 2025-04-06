import { Node, NodeKind } from "../Node.js"
import { TypeParameter } from "../parameters/TypeParameter.js"
import { Type } from "../types/Type.js"
import { BaseDecl, Decl } from "./Declaration.js"

export interface EnumDecl<
  Name extends string = string,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: typeof NodeKind.EnumDecl
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

export const isEnumDecl = (node: Node): node is EnumDecl<string, TypeParameter[]> =>
  node.kind === NodeKind.EnumDecl

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
