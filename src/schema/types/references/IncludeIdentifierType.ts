import { Decl, getNestedDeclarations, TypeArguments } from "../../declarations/Declaration.js"
import { TypeAliasDecl, validateTypeAliasDecl } from "../../declarations/TypeAliasDecl.js"
import { TypeParameter } from "../../parameters/TypeParameter.js"
import { ObjectType } from "../generic/ObjectType.js"
import { NodeKind } from "../Node.js"
import { replaceTypeArguments, Type } from "../Type.js"

type TConstraint<Params extends TypeParameter[]> = TypeAliasDecl<string, ObjectType<any>, Params>

export interface IncludeIdentifierType<
  T extends TConstraint<Params>,
  Params extends TypeParameter[] = [],
> {
  kind: typeof NodeKind.IncludeIdentifierType
  reference: T
  args: TypeArguments<Params>
}

export const IncludeIdentifier = <
  T extends TConstraint<Params>,
  Params extends TypeParameter[] = [],
>(
  reference: T,
  args: TypeArguments<Params>,
): IncludeIdentifierType<T, Params> => ({
  kind: NodeKind.IncludeIdentifierType,
  reference,
  args,
})

export const isIncludeIdentifierType = (
  type: Type,
): type is IncludeIdentifierType<TConstraint<TypeParameter[]>, TypeParameter[]> =>
  type.kind === NodeKind.IncludeIdentifierType

export const getNestedDeclarationsInIncludeIdentifierType = (
  type: IncludeIdentifierType<TConstraint<TypeParameter[]>, TypeParameter[]>,
): Decl[] => [type.reference, ...getNestedDeclarations(type.reference)]

export const validateIncludeIdentifierType = (
  type: IncludeIdentifierType<TConstraint<TypeParameter[]>, TypeParameter[]>,
  value: unknown,
): void => validateTypeAliasDecl(type.reference, type.args, value)

export const replaceTypeArgumentsInIncludeIdentifierType = (
  args: Record<string, Type>,
  type: IncludeIdentifierType<TConstraint<TypeParameter[]>, TypeParameter[]>,
): IncludeIdentifierType<TConstraint<TypeParameter[]>, TypeParameter[]> =>
  IncludeIdentifier(
    type.reference as unknown as TypeAliasDecl<string, ObjectType<any>, TypeParameter[]>,
    type.args.map(arg => replaceTypeArguments(args, arg)),
  )
