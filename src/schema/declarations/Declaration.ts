import { assertExhaustive } from "../../utils/typeSafety.js"
import { TypeParameter } from "../parameters/TypeParameter.js"
import { ObjectType } from "../types/generic/ObjectType.js"
import { NodeKind } from "../types/Node.js"
import { Type } from "../types/Type.js"
import { EntityDecl, getNestedDeclarationsInEntityDecl } from "./EntityDeclaration.js"
import { EnumDecl, getNestedDeclarationsInEnumDecl } from "./EnumDeclaration.js"
import { getNestedDeclarationsInTypeAliasDecl, TypeAliasDecl } from "./TypeAliasDecl.js"

export type TypeArguments<Params extends TypeParameter[]> = {
  [K in keyof Params]: Params[K] extends TypeParameter<string, infer T> ? T : Type
}

export const getParameterNames = (decl: Decl): string[] => decl.parameters.map(param => param.name)

export const getTypeArgumentsRecord = <Params extends TypeParameter[]>(
  decl: Decl<Params>,
  args: TypeArguments<Params>,
): Record<string, Type> =>
  Object.fromEntries(args.map((arg, i) => [decl.parameters[i]!.name, arg] as const))

export type Decl<Params extends TypeParameter[] = TypeParameter[]> =
  | EntityDecl<string, ObjectType<any>, string, Params>
  | EnumDecl<string, Params>
  | TypeAliasDecl<string, Type, Params>

export const getNestedDeclarations = (decl: Decl): Decl[] => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return getNestedDeclarationsInEntityDecl(decl)
    case NodeKind.EnumDecl:
      return getNestedDeclarationsInEnumDecl(decl)
    case NodeKind.TypeAliasDecl:
      return getNestedDeclarationsInTypeAliasDecl(decl)
    default:
      return assertExhaustive(decl)
  }
}
