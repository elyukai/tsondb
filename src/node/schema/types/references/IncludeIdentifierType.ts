import type {
  GetNestedDeclarations,
  SerializedTypeArguments,
  TypeArguments,
} from "../../declarations/Declaration.js"
import {
  getNestedDeclarations,
  getReferencesForDecl,
  resolveTypeArgumentsInDecl,
  validateDecl,
} from "../../declarations/Declaration.js"
import type { EnumDecl } from "../../declarations/EnumDecl.js"
import type { TypeAliasDecl } from "../../declarations/TypeAliasDecl.js"
import type { GetReferences, Node, Serializer } from "../../Node.js"
import { NodeKind } from "../../Node.js"
import type { SerializedTypeParameter, TypeParameter } from "../../TypeParameter.js"
import type { Validator } from "../../validation/type.js"
import type { EnumCaseDecl } from "../generic/EnumType.js"
import { formatEnumType } from "../generic/EnumType.js"
import type { BaseType, SerializedBaseType, StructureFormatter, Type } from "../Type.js"
import { formatValue, removeParentKey, resolveTypeArgumentsInType, serializeType } from "../Type.js"

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

export interface SerializedIncludeIdentifierType<
  Params extends SerializedTypeParameter[] = SerializedTypeParameter[],
> extends SerializedBaseType {
  kind: NodeKind["IncludeIdentifierType"]
  reference: string
  args: SerializedTypeArguments<Params>
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
> = (addedDecls, type) =>
  type.args.reduce(
    (accAddedDecls, arg) => getNestedDeclarations(accAddedDecls, arg),
    addedDecls.includes(type.reference)
      ? addedDecls
      : getNestedDeclarations([type.reference, ...addedDecls], type.reference),
  )

export const validateIncludeIdentifierType: Validator<IncludeIdentifierType> = (
  helpers,
  type,
  value,
) => validateDecl(helpers, type.reference, type.args, value)

export const resolveTypeArgumentsInIncludeIdentifierType = (
  args: Record<string, Type>,
  type: IncludeIdentifierType,
): Type =>
  type.args.length === 0
    ? type
    : resolveTypeArgumentsInDecl(
        type.reference,
        type.args.map(arg => resolveTypeArgumentsInType(args, arg)),
      ).type.value

export const serializeIncludeIdentifierType: Serializer<
  IncludeIdentifierType,
  SerializedIncludeIdentifierType
> = type => ({
  ...removeParentKey(type),
  reference: type.reference.name,
  args: type.args.map(arg => serializeType(arg)),
})

export const getReferencesForIncludeIdentifierType: GetReferences<IncludeIdentifierType> = (
  type,
  value,
) => getReferencesForDecl(resolveTypeArgumentsInDecl(type.reference, type.args), value)

export const formatIncludeIdentifierValue: StructureFormatter<IncludeIdentifierType> = (
  type,
  value,
) => {
  switch (type.reference.kind) {
    case NodeKind.TypeAliasDecl:
      return formatValue(type.reference.type.value, value)
    case NodeKind.EnumDecl:
      return formatEnumType(type.reference.type.value, value)
    default:
      return value
  }
}
