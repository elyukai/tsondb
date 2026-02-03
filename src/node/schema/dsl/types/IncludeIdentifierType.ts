import { NodeKind } from "../../../../shared/schema/Node.ts"
import type { IncludableDeclP, TypeArguments } from "../declarations/Decl.ts"
import type { EnumDecl } from "../declarations/EnumDecl.ts"
import { type TypeAliasDecl } from "../declarations/TypeAliasDecl.ts"
import type { Node } from "../index.ts"
import type { TypeParameter } from "../TypeParameter.ts"
import type { EnumCaseDecl } from "./EnumType.ts"
import type { BaseType, Type } from "./Type.ts"

type TConstraint<Params extends TypeParameter[]> =
  | TypeAliasDecl<string, Type, Params>
  | EnumDecl<string, Record<string, EnumCaseDecl>, Params>

export interface IncludeIdentifierType<
  Params extends TypeParameter[] = TypeParameter[],
  T extends TConstraint<Params> = TConstraint<Params>,
> extends BaseType {
  kind: NodeKind["IncludeIdentifierType"]
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

export const isNoGenericIncludeIdentifierType = (
  node: IncludeIdentifierType,
): node is IncludeIdentifierType<[], IncludableDeclP<[]>> =>
  node.args.length === 0 && node.reference.parameters.length === 0
