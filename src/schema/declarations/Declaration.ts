import { assertExhaustive } from "../../utils/typeSafety.js"
import { BaseNode, Node, NodeKind } from "../Node.js"
import { TypeParameter } from "../parameters/TypeParameter.js"
import { getNestedDeclarationsInArrayType } from "../types/generic/ArrayType.js"
import {
  getNestedDeclarationsInObjectType,
  MemberDecl,
  ObjectType,
} from "../types/generic/ObjectType.js"
import { getNestedDeclarationsInIncludeIdentifierType } from "../types/references/IncludeIdentifierType.js"
import { getNestedDeclarationsInNestedEntityMapType } from "../types/references/NestedEntityMapType.js"
import { getNestedDeclarationsInReferenceIdentifierType } from "../types/references/ReferenceIdentifierType.js"
import { Type } from "../types/Type.js"
import { ValidatorHelpers } from "../validation/type.js"
import {
  EntityDecl,
  getNestedDeclarationsInEntityDecl,
  isEntityDecl,
  validateEntityDecl,
} from "./EntityDecl.js"
import {
  EnumDecl,
  getNestedDeclarationsInEnumDecl,
  isEnumDecl,
  validateEnumDecl,
} from "./EnumDecl.js"
import {
  getNestedDeclarationsInTypeAliasDecl,
  isTypeAliasDecl,
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
  | EntityDecl<string, ObjectType<Record<string, MemberDecl<Type, true>>>, string, Params>
  | EnumDecl<string, Record<string, Type | null>, Params>
  | TypeAliasDecl<string, Type, Params>

export type SecondaryDecl = EnumDecl | TypeAliasDecl

export const getNestedDeclarations = (node: Node): Decl[] => {
  switch (node.kind) {
    case NodeKind.EntityDecl:
      return getNestedDeclarationsInEntityDecl(node)
    case NodeKind.EnumDecl:
      return getNestedDeclarationsInEnumDecl(node)
    case NodeKind.TypeAliasDecl:
      return getNestedDeclarationsInTypeAliasDecl(node)
    case NodeKind.ArrayType:
      return getNestedDeclarationsInArrayType(node)
    case NodeKind.ObjectType:
      return getNestedDeclarationsInObjectType(node)
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.GenericArgumentIdentifierType:
      return []
    case NodeKind.ReferenceIdentifierType:
      return getNestedDeclarationsInReferenceIdentifierType(node)
    case NodeKind.IncludeIdentifierType:
      return getNestedDeclarationsInIncludeIdentifierType(node)
    case NodeKind.NestedEntityMapType:
      return getNestedDeclarationsInNestedEntityMapType(node)
    default:
      return assertExhaustive(node)
  }
}

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
      return validateEntityDecl(helpers, decl, args, value)
    case NodeKind.EnumDecl:
      return validateEnumDecl(helpers, decl, args, value)
    case NodeKind.TypeAliasDecl:
      return validateTypeAliasDecl(helpers, decl, args, value)
    default:
      return assertExhaustive(decl)
  }
}
