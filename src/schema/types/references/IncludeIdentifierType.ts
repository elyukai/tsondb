import {
  GetNestedDeclarations,
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
import { BaseType, resolveTypeArgumentsInType, Type } from "../Type.js"

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

export const IncludeIdentifierType = <T extends TConstraint<[]>>(
  reference: T,
): IncludeIdentifierType<[], T> => ({
  kind: NodeKind.IncludeIdentifierType,
  reference,
  args: [],
})

export { IncludeIdentifierType as IncludeIdentifier }

export const isIncludeIdentifierType = (node: Node): node is IncludeIdentifierType =>
  node.kind === NodeKind.IncludeIdentifierType

export const getNestedDeclarationsInIncludeIdentifierType: GetNestedDeclarations<
  IncludeIdentifierType
> = (isDeclAdded, type) => [type.reference, ...getNestedDeclarations(isDeclAdded, type.reference)]

export const validateIncludeIdentifierType: Validator<IncludeIdentifierType> = (
  helpers,
  type,
  value,
) => validateDecl(helpers, type.reference, type.args, value)

export const resolveTypeArgumentsInIncludeIdentifierType = (
  args: Record<string, Type>,
  type: IncludeIdentifierType,
): IncludeIdentifierType =>
  GenIncludeIdentifierType(
    type.reference as unknown as SecondaryDecl,
    type.args.map(arg => resolveTypeArgumentsInType(args, arg)),
  )
