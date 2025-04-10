import { Lazy } from "../../utils/lazy.js"
import { Node, NodeKind } from "../Node.js"
import { TypeParameter } from "../parameters/TypeParameter.js"
import { getNestedDeclarationsInObjectType, isObjectType } from "../types/generic/ObjectType.js"
import {
  getNestedDeclarationsInIncludeIdentifierType,
  isIncludeIdentifierType,
} from "../types/references/IncludeIdentifierType.js"
import {
  getNestedDeclarationsInReferenceIdentifierType,
  isReferenceIdentifierType,
} from "../types/references/ReferenceIdentifierType.js"
import { replaceTypeArguments, Type, validate } from "../types/Type.js"
import { ValidatorHelpers } from "../validation/type.js"
import { BaseDecl, Decl, getTypeArgumentsRecord, TypeArguments } from "./Declaration.js"

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

export const getNestedDeclarationsInTypeAliasDecl = (
  decl: TypeAliasDecl<string, Type, TypeParameter[]>,
): Decl[] => {
  const type = decl.type.value
  if (isObjectType(type)) {
    return getNestedDeclarationsInObjectType(type)
  } else if (isIncludeIdentifierType(type)) {
    return getNestedDeclarationsInIncludeIdentifierType(type)
  } else if (isReferenceIdentifierType(type)) {
    return getNestedDeclarationsInReferenceIdentifierType(type)
  } else {
    return []
  }
}

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
