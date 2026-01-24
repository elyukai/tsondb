import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { BaseNode, CustomConstraintValidator, Node } from "../Node.ts"
import { NodeKind, resolveTypeArguments } from "../Node.ts"
import type { TypeParameter } from "../TypeParameter.ts"
import type { EnumCaseDecl } from "../types/generic/EnumType.ts"
import { walkTypeNodeTree, type Type } from "../types/Type.ts"
import type { EntityDecl } from "./EntityDecl.ts"
import { isEntityDecl } from "./EntityDecl.ts"
import type { EnumDecl } from "./EnumDecl.ts"
import { checkCustomConstraintsInEnumDecl, isEnumDecl } from "./EnumDecl.ts"
import type { TypeAliasDecl } from "./TypeAliasDecl.ts"
import { checkCustomConstraintsInTypeAliasDecl, isTypeAliasDecl } from "./TypeAliasDecl.ts"

export type TypeArguments<Params extends TypeParameter[]> = {
  [K in keyof Params]: Params[K] extends TypeParameter<string, infer T> ? T : Type
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

export type Decl = EntityDecl | EnumDecl | TypeAliasDecl

export type DeclP<Params extends TypeParameter[] = TypeParameter[]> =
  | EntityDecl
  | EnumDecl<string, Record<string, EnumCaseDecl>, Params>
  | TypeAliasDecl<string, Type, Params>

export type IncludableDeclP<Params extends TypeParameter[] = TypeParameter[]> =
  | EnumDecl<string, Record<string, EnumCaseDecl>, Params>
  | TypeAliasDecl<string, Type, Params>

export type SecondaryDecl = EnumDecl | TypeAliasDecl

export const isDecl = (node: Node): node is Decl =>
  isEntityDecl(node) || isEnumDecl(node) || isTypeAliasDecl(node)

export const asDecl = (node: Node | undefined): Decl | undefined =>
  node && isDecl(node) ? node : undefined

export interface BaseDecl<
  Name extends string = string,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseNode {
  sourceUrl: string
  name: Name
  comment?: string
  parameters: Params
}

const declNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/

export const validateDeclName = (name: string) => {
  if (!declNamePattern.test(name)) {
    throw new Error(
      `Invalid declaration name "${name}". Declaration names must match the pattern ${declNamePattern.toString()}.`,
    )
  }
}

export const isDeclWithoutTypeParameters = (decl: Decl): decl is DeclP<[]> =>
  decl.parameters.length === 0

export const resolveTypeArgumentsInDecls = (decls: readonly Decl[]): Decl[] =>
  decls.filter(isDeclWithoutTypeParameters).map(decl => resolveTypeArguments({}, decl, []))

export function walkNodeTree(
  callbackFn: (node: Node, parentTypes: Type[], parentDecl: Decl) => void,
  decl: Decl,
): void {
  callbackFn(decl, [], decl)
  walkTypeNodeTree(callbackFn, decl.type.value, [], decl)
}

export const groupDeclarationsBySourceUrl = (
  decls: readonly Decl[],
): Partial<Record<string, Decl[]>> => Object.groupBy(decls, decl => decl.sourceUrl)

export const checkCustomConstraintsInNestedDecl: CustomConstraintValidator<SecondaryDecl> = (
  decl,
  value,
  helpers,
) => {
  switch (decl.kind) {
    case NodeKind.EnumDecl:
      return checkCustomConstraintsInEnumDecl(decl, value, helpers)
    case NodeKind.TypeAliasDecl:
      return checkCustomConstraintsInTypeAliasDecl(decl, value, helpers)
    default:
      return assertExhaustive(decl)
  }
}
