import { assertExhaustive } from "../../../shared/utils/typeSafety.ts"
import type { BaseNode, GetReferences, GetReferencesSerialized, Node, Serializer } from "../Node.ts"
import { NodeKind } from "../Node.ts"
import type { SerializedTypeParameter, TypeParameter } from "../TypeParameter.ts"
import { getNestedDeclarationsInArrayType } from "../types/generic/ArrayType.ts"
import type { EnumCaseDecl, SerializedEnumCaseDecl } from "../types/generic/EnumType.ts"
import { getNestedDeclarationsInEnumType } from "../types/generic/EnumType.ts"
import { getNestedDeclarationsInObjectType } from "../types/generic/ObjectType.ts"
import { getNestedDeclarationsInIncludeIdentifierType } from "../types/references/IncludeIdentifierType.ts"
import { getNestedDeclarationsInNestedEntityMapType } from "../types/references/NestedEntityMapType.ts"
import { getNestedDeclarationsInReferenceIdentifierType } from "../types/references/ReferenceIdentifierType.ts"
import { walkTypeNodeTree, type SerializedType, type Type } from "../types/Type.ts"
import type { ValidatorHelpers } from "../validation/type.ts"
import type { EntityDecl, SerializedEntityDecl } from "./EntityDecl.ts"
import {
  getNestedDeclarationsInEntityDecl,
  getReferencesForEntityDecl,
  getReferencesForSerializedEntityDecl,
  isEntityDecl,
  resolveTypeArgumentsInEntityDecl,
  resolveTypeArgumentsInSerializedEntityDecl,
  serializeEntityDecl,
  validateEntityDecl,
} from "./EntityDecl.ts"
import type { EnumDecl, SerializedEnumDecl } from "./EnumDecl.ts"
import {
  getNestedDeclarationsInEnumDecl,
  getReferencesForEnumDecl,
  getReferencesForSerializedEnumDecl,
  isEnumDecl,
  resolveTypeArgumentsInEnumDecl,
  resolveTypeArgumentsInSerializedEnumDecl,
  serializeEnumDecl,
  validateEnumDecl,
} from "./EnumDecl.ts"
import type { SerializedTypeAliasDecl, TypeAliasDecl } from "./TypeAliasDecl.ts"
import {
  getNestedDeclarationsInTypeAliasDecl,
  getReferencesForSerializedTypeAliasDecl,
  getReferencesForTypeAliasDecl,
  isTypeAliasDecl,
  resolveTypeArgumentsInSerializedTypeAliasDecl,
  resolveTypeArgumentsInTypeAliasDecl,
  serializeTypeAliasDecl,
  validateTypeAliasDecl,
} from "./TypeAliasDecl.ts"

export type TypeArguments<Params extends TypeParameter[]> = {
  [K in keyof Params]: Params[K] extends TypeParameter<string, infer T> ? T : Type
}

export type SerializedTypeArguments<Params extends SerializedTypeParameter[]> = {
  [K in keyof Params]: Params[K] extends SerializedTypeParameter<string, infer T> ? T : Type
}

export const getParameterNames = (decl: Decl): string[] => decl.parameters.map(param => param.name)

export const getTypeArgumentsRecord = <Params extends TypeParameter[]>(
  decl: DeclP<Params>,
  args: TypeArguments<Params>,
): Record<string, Type> =>
  Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    args.slice(0, decl.parameters.length).map((arg, i) => [decl.parameters[i]!.name, arg] as const),
  )

export const getSerializedTypeArgumentsRecord = <Params extends SerializedTypeParameter[]>(
  decl: SerializedDeclP<Params>,
  args: SerializedTypeArguments<Params>,
): Record<string, SerializedType> =>
  Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    args.slice(0, decl.parameters.length).map((arg, i) => [decl.parameters[i]!.name, arg] as const),
  )

export type Decl = EntityDecl | EnumDecl | TypeAliasDecl

export type SerializedDecl = SerializedEntityDecl | SerializedEnumDecl | SerializedTypeAliasDecl

export type DeclP<Params extends TypeParameter[] = TypeParameter[]> =
  | EntityDecl
  | EnumDecl<string, Record<string, EnumCaseDecl>, Params>
  | TypeAliasDecl<string, Type, Params>

export type SerializedDeclP<Params extends SerializedTypeParameter[] = SerializedTypeParameter[]> =
  | SerializedEntityDecl
  | SerializedEnumDecl<string, Record<string, SerializedEnumCaseDecl>, Params>
  | SerializedTypeAliasDecl<string, SerializedType, Params>

export type SecondaryDecl = EnumDecl | TypeAliasDecl

export type SerializedSecondaryDecl = SerializedEnumDecl | SerializedTypeAliasDecl

export const getNestedDeclarations: GetNestedDeclarations = (addedDecls, node) => {
  switch (node.kind) {
    case NodeKind.EntityDecl:
      return getNestedDeclarationsInEntityDecl(addedDecls, node)
    case NodeKind.EnumDecl:
      return getNestedDeclarationsInEnumDecl(addedDecls, node)
    case NodeKind.TypeAliasDecl:
      return getNestedDeclarationsInTypeAliasDecl(addedDecls, node)
    case NodeKind.ArrayType:
      return getNestedDeclarationsInArrayType(addedDecls, node)
    case NodeKind.ObjectType:
      return getNestedDeclarationsInObjectType(addedDecls, node)
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.TypeArgumentType:
      return addedDecls
    case NodeKind.ReferenceIdentifierType:
      return getNestedDeclarationsInReferenceIdentifierType(addedDecls, node)
    case NodeKind.IncludeIdentifierType:
      return getNestedDeclarationsInIncludeIdentifierType(addedDecls, node)
    case NodeKind.NestedEntityMapType:
      return getNestedDeclarationsInNestedEntityMapType(addedDecls, node)
    case NodeKind.EnumType:
      return getNestedDeclarationsInEnumType(addedDecls, node)
    default:
      return assertExhaustive(node)
  }
}

export type GetNestedDeclarations<T extends Node = Node> = (addedDecls: Decl[], node: T) => Decl[]

export const isDecl = (node: Node): node is Decl =>
  isEntityDecl(node) || isEnumDecl(node) || isTypeAliasDecl(node)

export interface BaseDecl<
  Name extends string = string,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseNode {
  sourceUrl: string
  name: Name
  comment?: string
  parameters: Params
}

export interface SerializedBaseDecl<
  Name extends string = string,
  Params extends SerializedTypeParameter[] = SerializedTypeParameter[],
> extends BaseNode {
  sourceUrl: string
  name: Name
  comment?: string
  parameters: Params
}

export const validateDecl = (
  helpers: ValidatorHelpers,
  decl: Decl,
  args: Type[],
  value: unknown,
) => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return validateEntityDecl(helpers, decl, value)
    case NodeKind.EnumDecl:
      return validateEnumDecl(helpers, decl, args, value)
    case NodeKind.TypeAliasDecl:
      return validateTypeAliasDecl(helpers, decl, args, value)
    default:
      return assertExhaustive(decl)
  }
}

const declNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/

export const validateDeclName = (name: string) => {
  if (!declNamePattern.test(name)) {
    throw new Error(
      `Invalid declaration name "${name}". Declaration names must match the pattern ${declNamePattern.toString()}.`,
    )
  }
}

export const resolveTypeArgumentsInDecl = <Params extends TypeParameter[]>(
  decl: DeclP<Params>,
  args: TypeArguments<Params>,
): DeclP<[]> => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return resolveTypeArgumentsInEntityDecl(decl)
    case NodeKind.EnumDecl:
      return resolveTypeArgumentsInEnumDecl(decl, args)
    case NodeKind.TypeAliasDecl:
      return resolveTypeArgumentsInTypeAliasDecl(decl, args)
    default:
      return assertExhaustive(decl)
  }
}

export const resolveTypeArgumentsInSerializedDecl = <Params extends SerializedTypeParameter[]>(
  declName: string,
  args: SerializedTypeArguments<Params>,
  decls: Record<string, SerializedDecl>,
): SerializedDeclP<[]> => {
  const decl = decls[declName]
  switch (decl?.kind) {
    case NodeKind.EntityDecl:
      return resolveTypeArgumentsInSerializedEntityDecl(decl, decls)
    case NodeKind.EnumDecl:
      return resolveTypeArgumentsInSerializedEnumDecl(decl, args, decls)
    case NodeKind.TypeAliasDecl:
      return resolveTypeArgumentsInSerializedTypeAliasDecl(decl, args, decls)
    case undefined:
      throw new Error(`the entity "${declName}" cannot be resolved`)
    default:
      return assertExhaustive(decl)
  }
}

export const isDeclWithoutTypeParameters = (decl: Decl): decl is DeclP<[]> =>
  decl.parameters.length === 0

export const resolveTypeArgumentsInDecls = (decls: readonly Decl[]) =>
  decls.filter(isDeclWithoutTypeParameters).map(decl => resolveTypeArgumentsInDecl(decl, []))

export function walkNodeTree(callbackFn: (node: Node) => void, decl: Decl): void {
  switch (decl.kind) {
    case NodeKind.EntityDecl: {
      callbackFn(decl)
      walkTypeNodeTree(callbackFn, decl.type.value)
      return
    }
    case NodeKind.EnumDecl: {
      callbackFn(decl)
      walkTypeNodeTree(callbackFn, decl.type.value)
      return
    }
    case NodeKind.TypeAliasDecl: {
      callbackFn(decl)
      walkTypeNodeTree(callbackFn, decl.type.value)
      return
    }
    default:
      return assertExhaustive(decl)
  }
}

export const serializeDecl: Serializer<Decl, SerializedDecl> = decl => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return serializeEntityDecl(decl)
    case NodeKind.EnumDecl:
      return serializeEnumDecl(decl)
    case NodeKind.TypeAliasDecl:
      return serializeTypeAliasDecl(decl)
    default:
      return assertExhaustive(decl)
  }
}

export const getReferencesForDecl: GetReferences<Decl> = (decl, value) => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return getReferencesForEntityDecl(decl, value)
    case NodeKind.EnumDecl:
      return getReferencesForEnumDecl(decl, value)
    case NodeKind.TypeAliasDecl:
      return getReferencesForTypeAliasDecl(decl, value)
    default:
      return assertExhaustive(decl)
  }
}

export const getReferencesForSerializedDecl: GetReferencesSerialized<SerializedDecl> = (
  decl,
  value,
  decls,
) => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return getReferencesForSerializedEntityDecl(decl, value, decls)
    case NodeKind.EnumDecl:
      return getReferencesForSerializedEnumDecl(decl, value, decls)
    case NodeKind.TypeAliasDecl:
      return getReferencesForSerializedTypeAliasDecl(decl, value, decls)
    default:
      return assertExhaustive(decl)
  }
}

export const groupDeclarationsBySourceUrl = (
  decls: readonly Decl[],
): Partial<Record<string, Decl[]>> => Object.groupBy(decls, decl => decl.sourceUrl)
