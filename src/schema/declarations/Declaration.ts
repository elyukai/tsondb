import { assertExhaustive } from "../../utils/typeSafety.js"
import { BaseNode, Node, NodeKind } from "../Node.js"
import { TypeParameter } from "../parameters/TypeParameter.js"
import { getNestedDeclarationsInArrayType } from "../types/generic/ArrayType.js"
import { getNestedDeclarationsInObjectType, ObjectType } from "../types/generic/ObjectType.js"
import { getNestedDeclarationsInIncludeIdentifierType } from "../types/references/IncludeIdentifierType.js"
import { getNestedDeclarationsInNestedEntityMapType } from "../types/references/NestedEntityMapType.js"
import { getNestedDeclarationsInReferenceIdentifierType } from "../types/references/ReferenceIdentifierType.js"
import { Type } from "../types/Type.js"
import { ValidatorHelpers } from "../validation/type.js"
import {
  EntityDecl,
  getNestedDeclarationsInEntityDecl,
  isEntityDecl,
  resolveTypeArgumentsInEntityDecl,
  validateEntityDecl,
} from "./EntityDecl.js"
import {
  EnumDecl,
  getNestedDeclarationsInEnumDecl,
  isEnumDecl,
  resolveTypeArgumentsInEnumDecl,
  validateEnumDecl,
} from "./EnumDecl.js"
import {
  getNestedDeclarationsInTypeAliasDecl,
  isTypeAliasDecl,
  resolveTypeArgumentsInTypeAliasDecl,
  TypeAliasDecl,
  validateTypeAliasDecl,
} from "./TypeAliasDecl.js"

export type TypeArguments<Params extends TypeParameter[]> = {
  [K in keyof Params]: Params[K] extends TypeParameter<string, infer T> ? T : Type
}

export const getParameterNames = (decl: Decl): string[] => decl.parameters.map(param => param.name)

export const getTypeArgumentsRecord = <Params extends TypeParameter[]>(
  decl: DeclP<Params>,
  args: TypeArguments<Params>,
): Record<string, Type> =>
  Object.fromEntries(args.map((arg, i) => [decl.parameters[i]!.name, arg] as const))

export type Decl = EntityDecl | EnumDecl | TypeAliasDecl

export type DeclP<Params extends TypeParameter[] = TypeParameter[]> =
  | EntityDecl<string, ObjectType>
  | EnumDecl<string, Record<string, Type | null>, Params>
  | TypeAliasDecl<string, Type, Params>

export type SecondaryDecl = EnumDecl | TypeAliasDecl

export const getNestedDeclarations: GetNestedDeclarations = (isDeclAdded, node) => {
  switch (node.kind) {
    case NodeKind.EntityDecl:
      return isDeclAdded(node) ? [] : getNestedDeclarationsInEntityDecl(isDeclAdded, node)
    case NodeKind.EnumDecl:
      return isDeclAdded(node) ? [] : getNestedDeclarationsInEnumDecl(isDeclAdded, node)
    case NodeKind.TypeAliasDecl:
      return isDeclAdded(node) ? [] : getNestedDeclarationsInTypeAliasDecl(isDeclAdded, node)
    case NodeKind.ArrayType:
      return getNestedDeclarationsInArrayType(isDeclAdded, node)
    case NodeKind.ObjectType:
      return getNestedDeclarationsInObjectType(isDeclAdded, node)
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.GenericArgumentIdentifierType:
      return []
    case NodeKind.ReferenceIdentifierType:
      return getNestedDeclarationsInReferenceIdentifierType(isDeclAdded, node)
    case NodeKind.IncludeIdentifierType:
      return getNestedDeclarationsInIncludeIdentifierType(isDeclAdded, node)
    case NodeKind.NestedEntityMapType:
      return getNestedDeclarationsInNestedEntityMapType(isDeclAdded, node)
    default:
      return assertExhaustive(node)
  }
}

export type GetNestedDeclarations<T extends Node = Node> = (
  isDeclarationAdded: (decl: Decl) => boolean,
  node: T,
) => Decl[]

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

export const isDeclWithoutTypeParameters = (decl: Decl): decl is DeclP<[]> =>
  decl.parameters.length === 0

export const resolveTypeArgumentsInDecls = (decls: readonly Decl[]) =>
  decls.filter(isDeclWithoutTypeParameters).map(decl => resolveTypeArgumentsInDecl(decl, []))
