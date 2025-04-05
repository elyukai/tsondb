import { TypeParameter } from "../parameters/TypeParameter.js"
import { getNestedDeclarationsInObjectType, isObjectType } from "../types/generic/ObjectType.js"
import { NodeKind } from "../types/Node.js"
import {
  getNestedDeclarationsInIncludeIdentifierType,
  isIncludeIdentifierType,
} from "../types/references/IncludeIdentifierType.js"
import {
  getNestedDeclarationsInReferenceIdentifierType,
  isReferenceIdentifierType,
} from "../types/references/ReferenceIdentifierType.js"
import { replaceTypeArguments, Type, validate } from "../types/Type.js"
import { Decl, getTypeArgumentsRecord, TypeArguments } from "./Declaration.js"

export interface TypeAliasDecl<
  Name extends string,
  T extends Type,
  Params extends TypeParameter[],
> {
  kind: typeof NodeKind.TypeAliasDecl
  sourceUrl: string
  name: Name
  comment?: string
  parameters: Params
  type: (...args: Params) => T
}

export const GenTypeAlias = <Name extends string, T extends Type, Params extends TypeParameter[]>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    parameters: Params
    type: (...args: Params) => T
  },
): TypeAliasDecl<Name, T, Params> => ({
  kind: NodeKind.TypeAliasDecl,
  sourceUrl,
  ...options,
})

export const TypeAlias = <Name extends string, T extends Type>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    type: () => T
  },
): TypeAliasDecl<Name, T, []> => ({
  kind: NodeKind.TypeAliasDecl,
  sourceUrl,
  ...options,
  parameters: [],
})

export const isTypeAliasDecl = (decl: Decl): decl is TypeAliasDecl<string, Type, TypeParameter[]> =>
  decl.kind === NodeKind.TypeAliasDecl

export const getNestedDeclarationsInTypeAliasDecl = (
  decl: TypeAliasDecl<string, Type, TypeParameter[]>,
): Decl[] => {
  const type = decl.type(...decl.parameters)
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
  decl: TypeAliasDecl<string, Type, Params>,
  args: TypeArguments<Params>,
  value: unknown,
): void =>
  validate(
    replaceTypeArguments(getTypeArgumentsRecord(decl, args), decl.type(...decl.parameters)),
    value,
  )
