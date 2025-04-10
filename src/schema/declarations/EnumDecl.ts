import { Node, NodeKind } from "../Node.js"
import { TypeParameter } from "../parameters/TypeParameter.js"
import { Type } from "../types/Type.js"
import { ValidatorHelpers } from "../validation/type.js"
import { BaseDecl, GetNestedDeclarations, getNestedDeclarations } from "./Declaration.js"

export interface EnumDecl<
  Name extends string = string,
  T extends Record<string, Type | null> = Record<string, Type | null>,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: typeof NodeKind.EnumDecl
  values: (...args: Params) => T
}

export const GenEnumDecl = <
  Name extends string,
  T extends Record<string, Type | null>,
  Params extends TypeParameter[],
>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    parameters: Params
    values: (...args: Params) => T
  },
): EnumDecl<Name, T, Params> => ({
  kind: NodeKind.EnumDecl,
  sourceUrl,
  ...options,
})

export { GenEnumDecl as GenEnum }

export const EnumDecl = <Name extends string, T extends Record<string, Type | null>>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    values: () => T
  },
): EnumDecl<Name, T, []> => ({
  kind: NodeKind.EnumDecl,
  sourceUrl,
  ...options,
  parameters: [],
})

export { EnumDecl as Enum }

export const isEnumDecl = (node: Node): node is EnumDecl => node.kind === NodeKind.EnumDecl

export const getNestedDeclarationsInEnumDecl: GetNestedDeclarations<EnumDecl> = (
  isDeclAdded,
  decl,
) =>
  Object.values(decl.values()).flatMap(caseDef =>
    caseDef === null ? [] : getNestedDeclarations(isDeclAdded, caseDef),
  )

export const validateEnumDecl = (
  _helpers: ValidatorHelpers,
  _decl: EnumDecl,
  _args: Type[],
  _value: unknown,
): Error[] => []

export const replaceTypeArgumentsInEnumDecl = <Args extends Record<string, Type>>(
  _args: Args,
  decl: EnumDecl,
): EnumDecl => decl
