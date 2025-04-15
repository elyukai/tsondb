import { Lazy } from "../../utils/lazy.js"
import { Node, NodeKind } from "../Node.js"
import { TypeParameter } from "../parameters/TypeParameter.js"
import { Type } from "../types/Type.js"
import { ValidatorHelpers } from "../validation/type.js"
import {
  BaseDecl,
  GetNestedDeclarations,
  getNestedDeclarations,
  validateDeclName,
} from "./Declaration.js"

export interface EnumDecl<
  Name extends string = string,
  T extends Record<string, Type | null> = Record<string, Type | null>,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: typeof NodeKind.EnumDecl
  values: Lazy<T>
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
): EnumDecl<Name, T, Params> => {
  validateDeclName(options.name)

  const decl: EnumDecl<Name, T, Params> = {
    ...options,
    kind: NodeKind.EnumDecl,
    sourceUrl,
    values: Lazy.of(() => {
      const type = options.values(...options.parameters)
      Object.values(type).forEach(type => {
        if (type) {
          type.parent = decl
        }
      })
      return type
    }),
  }

  return decl
}

export { GenEnumDecl as GenEnum }

export const EnumDecl = <Name extends string, T extends Record<string, Type | null>>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    values: () => T
  },
): EnumDecl<Name, T, []> => {
  validateDeclName(options.name)

  const decl: EnumDecl<Name, T, []> = {
    ...options,
    kind: NodeKind.EnumDecl,
    sourceUrl,
    parameters: [],
    values: Lazy.of(() => {
      const type = options.values()
      Object.values(type).forEach(type => {
        if (type) {
          type.parent = decl
        }
      })
      return type
    }),
  }

  return decl
}

export { EnumDecl as Enum }

export const isEnumDecl = (node: Node): node is EnumDecl => node.kind === NodeKind.EnumDecl

export const getNestedDeclarationsInEnumDecl: GetNestedDeclarations<EnumDecl> = (
  isDeclAdded,
  decl,
) =>
  Object.values(decl.values.value).flatMap(caseDef =>
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
