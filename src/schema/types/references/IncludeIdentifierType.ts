import {
  Decl,
  getNestedDeclarations,
  SecondaryDecl,
  TypeArguments,
  validateDecl,
} from "../../declarations/Declaration.js"
import { EnumDecl } from "../../declarations/EnumDecl.js"
import { TypeAliasDecl } from "../../declarations/TypeAliasDecl.js"
import { Node, NodeKind } from "../../Node.js"
import { TypeParameter } from "../../parameters/TypeParameter.js"
import { Validator } from "../../validation/type.js"
import { BaseType, replaceTypeArguments, Type } from "../Type.js"

type TConstraint<Params extends TypeParameter[]> =
  | TypeAliasDecl<string, Type, Params>
  | EnumDecl<string, Record<string, Type | null>, Params>

export interface IncludeIdentifierType<
  Params extends TypeParameter[] = TypeParameter[],
  T extends TConstraint<Params> = TConstraint<Params>,
> extends BaseType {
  kind: typeof NodeKind.IncludeIdentifierType
  reference: T
  args: TypeArguments<Params>
}

export const GenIncludeIdentifierType = <
  T extends TConstraint<Params>,
  Params extends TypeParameter[] = [],
>(
  reference: T,
  args: TypeArguments<Params>,
): IncludeIdentifierType<Params, T> => ({
  kind: NodeKind.IncludeIdentifierType,
  reference,
  args,
})

export { GenIncludeIdentifierType as GenIncludeIdentifier }

export const isIncludeIdentifierType = (node: Node): node is IncludeIdentifierType =>
  node.kind === NodeKind.IncludeIdentifierType

export const getNestedDeclarationsInIncludeIdentifierType = (
  type: IncludeIdentifierType,
): Decl[] => [type.reference, ...getNestedDeclarations(type.reference)]

export const validateIncludeIdentifierType: Validator<IncludeIdentifierType> = (
  helpers,
  type,
  value,
) => validateDecl(helpers, type.reference, type.args, value)

export const replaceTypeArgumentsInIncludeIdentifierType = (
  args: Record<string, Type>,
  type: IncludeIdentifierType,
): IncludeIdentifierType =>
  GenIncludeIdentifierType(
    type.reference as unknown as SecondaryDecl,
    type.args.map(arg => replaceTypeArguments(args, arg)),
  )
