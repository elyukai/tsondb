import { Lazy } from "../../utils/lazy.js"
import { Node, NodeKind } from "../Node.js"
import { TypeParameter } from "../parameters/TypeParameter.js"
import { replaceTypeArguments, Type, validate } from "../types/Type.js"
import { ValidatorHelpers } from "../validation/type.js"
import {
  BaseDecl,
  GetNestedDeclarations,
  getNestedDeclarations,
  getTypeArgumentsRecord,
  TypeArguments,
  validateDeclName,
} from "./Declaration.js"

export interface TypeAliasDecl<
  Name extends string = string,
  T extends Type = Type,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: typeof NodeKind.TypeAliasDecl
  type: Lazy<T>
}

export const GenTypeAliasDecl = <
  Name extends string,
  T extends Type,
  Params extends TypeParameter[],
>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    parameters: Params
    type: (...args: Params) => T
  },
): TypeAliasDecl<Name, T, Params> => {
  validateDeclName(options.name)

  const decl: TypeAliasDecl<Name, T, Params> = {
    kind: NodeKind.TypeAliasDecl,
    sourceUrl,
    ...options,
    type: Lazy.of(() => {
      const type = options.type(...options.parameters)
      type.parent = decl
      return type
    }),
  }

  return decl
}

export { GenTypeAliasDecl as GenTypeAlias }

export const TypeAliasDecl = <Name extends string, T extends Type>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    type: () => T
  },
): TypeAliasDecl<Name, T, []> => {
  validateDeclName(options.name)

  const decl: TypeAliasDecl<Name, T, []> = {
    kind: NodeKind.TypeAliasDecl,
    sourceUrl,
    ...options,
    parameters: [],
    type: Lazy.of(() => {
      const type = options.type()
      type.parent = decl
      return type
    }),
  }

  return decl
}

export { TypeAliasDecl as TypeAlias }

export const isTypeAliasDecl = (node: Node): node is TypeAliasDecl<string, Type, TypeParameter[]> =>
  node.kind === NodeKind.TypeAliasDecl

export const getNestedDeclarationsInTypeAliasDecl: GetNestedDeclarations<TypeAliasDecl> = (
  isDeclAdded,
  decl,
) => getNestedDeclarations(isDeclAdded, decl.type.value)

export const validateTypeAliasDecl = <Params extends TypeParameter[]>(
  helpers: ValidatorHelpers,
  decl: TypeAliasDecl<string, Type, Params>,
  args: TypeArguments<Params>,
  value: unknown,
): Error[] =>
  validate(
    helpers,
    replaceTypeArguments(getTypeArgumentsRecord(decl, args), decl.type.value),
    value,
  )
