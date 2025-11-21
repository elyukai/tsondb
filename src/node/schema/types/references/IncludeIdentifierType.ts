import type { SerializedTypeArguments } from "../../../../shared/schema/declarations/Declaration.ts"
import type { SerializedIncludeIdentifierType } from "../../../../shared/schema/types/IncludeIdentifierType.ts"
import type { Decl, IncludableDeclP, TypeArguments } from "../../declarations/Declaration.ts"
import {
  getTypeArgumentsRecord,
  isDeclWithoutTypeParameters,
} from "../../declarations/Declaration.ts"
import type { EnumDecl } from "../../declarations/EnumDecl.ts"
import { isTypeAliasDecl, type TypeAliasDecl } from "../../declarations/TypeAliasDecl.ts"
import type {
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  SerializedTypeParameters,
  Serializer,
  TypeArgumentsResolver,
  Validator,
} from "../../Node.ts"
import {
  getNestedDeclarations,
  getReferences,
  NodeKind,
  resolveTypeArguments,
  serializeNode,
  validateDecl,
} from "../../Node.ts"
import type { TypeParameter } from "../../TypeParameter.ts"
import type { EnumCaseDecl } from "../generic/EnumType.ts"
import { formatEnumType } from "../generic/EnumType.ts"
import type { BaseType, StructureFormatter, Type } from "../Type.ts"
import { formatValue } from "../Type.ts"
import { isTypeArgumentType } from "./TypeArgumentType.ts"

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

export const isIncludeIdentifierType: Predicate<IncludeIdentifierType> = node =>
  node.kind === NodeKind.IncludeIdentifierType

const isNoGenericIncludeIdentifierType = (
  node: IncludeIdentifierType,
): node is IncludeIdentifierType<[], IncludableDeclP<[]>> =>
  node.args.length === 0 && node.reference.parameters.length === 0

export const getNestedDeclarationsInIncludeIdentifierType: GetNestedDeclarations<
  IncludeIdentifierType
> = (addedDecls, type, parentDecl) =>
  type.args.reduce(
    (accAddedDecls, arg) => getNestedDeclarations(accAddedDecls, arg, parentDecl),
    addedDecls.includes(type.reference)
      ? addedDecls
      : getNestedDeclarations(addedDecls, type.reference, parentDecl),
  )

export const validateIncludeIdentifierType: Validator<IncludeIdentifierType> = (
  helpers,
  inDecls,
  type,
  value,
) => validateDecl(helpers, inDecls, type.reference, type.args, value)

export const resolveTypeArgumentsInIncludeIdentifierType = (<T extends IncludeIdentifierType>(
  args: Record<string, Type>,
  type: T,
  inDecl: Decl[],
) => {
  if (isNoGenericIncludeIdentifierType(type)) {
    return type
  } else {
    type ReturnType = T extends IncludeIdentifierType<[], IncludableDeclP<[]>> ? T : Type

    const parentDecl = inDecl[inDecl.length - 1]
    const grandParentDecl = inDecl[inDecl.length - 2]

    if (
      type.reference === parentDecl &&
      parentDecl.parameters.length > 0 &&
      grandParentDecl &&
      isDeclWithoutTypeParameters(grandParentDecl) &&
      isTypeAliasDecl(grandParentDecl) &&
      type.args.every(
        (arg, argIndex) =>
          isTypeArgumentType(arg) && parentDecl.parameters[argIndex] === arg.argument,
      )
    ) {
      const grandParentDeclType = grandParentDecl.type.value

      if (
        isIncludeIdentifierType(grandParentDeclType) &&
        grandParentDeclType.reference === type.reference
      ) {
        return IncludeIdentifierType(grandParentDecl) as ReturnType
      }
    }

    return resolveTypeArguments(
      getTypeArgumentsRecord(
        type.reference,
        type.args.map(arg => resolveTypeArguments(args, arg, inDecl)),
      ),
      type.reference,
      inDecl,
    ).type.value as ReturnType
  }
}) satisfies TypeArgumentsResolver<IncludeIdentifierType>

export const serializeIncludeIdentifierType = (<
  Params extends TypeParameter[] = TypeParameter[],
  T extends TConstraint<Params> = TConstraint<Params>,
>(
  type: IncludeIdentifierType<Params, T>,
): SerializedIncludeIdentifierType<SerializedTypeParameters<Params>> => ({
  ...type,
  reference: type.reference.name,
  args: type.args.map(arg => serializeNode(arg)) as SerializedTypeArguments<
    SerializedTypeParameters<Params>
  >,
})) satisfies Serializer<IncludeIdentifierType>

export const getReferencesForIncludeIdentifierType: GetReferences<IncludeIdentifierType> = (
  type,
  value,
  inDecl,
) =>
  getReferences(
    resolveTypeArguments(getTypeArgumentsRecord(type.reference, type.args), type.reference, inDecl),
    value,
    inDecl,
  )

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
