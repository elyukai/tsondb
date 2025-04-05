import { TypeParameter } from "../parameters/TypeParameter.js"
import { getNestedDeclarationsInObjectType, ObjectType } from "../types/generic/ObjectType.js"
import { NodeKind } from "../types/Node.js"
import { replaceTypeArguments, validate } from "../types/Type.js"
import { Decl, getTypeArgumentsRecord, TypeArguments } from "./Declaration.js"

export interface EntityDecl<
  Name extends string,
  T extends ObjectType<any>,
  PK extends keyof T["properties"],
  Params extends TypeParameter[],
> {
  kind: typeof NodeKind.EntityDecl
  sourceUrl: string
  name: Name
  comment?: string
  parameters: Params
  type: (...args: Params) => T
  primaryKey: PK[]
}

export const GenEntity = <
  Name extends string,
  T extends ObjectType<any>,
  PK extends keyof T["properties"],
  Params extends TypeParameter[],
>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    parameters: Params
    type: (...args: Params) => T
    primaryKey: PK | PK[]
  },
): EntityDecl<Name, T, PK, Params> => ({
  kind: NodeKind.EntityDecl,
  sourceUrl,
  ...options,
  primaryKey: Array.isArray(options.primaryKey) ? options.primaryKey : [options.primaryKey],
})

export const Entity = <
  Name extends string,
  T extends ObjectType<any>,
  PK extends keyof T["properties"],
>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    type: () => T
    primaryKey: PK | PK[]
  },
): EntityDecl<Name, T, PK, []> => ({
  kind: NodeKind.EntityDecl,
  sourceUrl,
  ...options,
  parameters: [],
  primaryKey: Array.isArray(options.primaryKey) ? options.primaryKey : [options.primaryKey],
})

export const isEntityDecl = (
  decl: Decl,
): decl is EntityDecl<string, ObjectType<any>, string, TypeParameter[]> =>
  decl.kind === NodeKind.EntityDecl

export const getNestedDeclarationsInEntityDecl = (
  decl: EntityDecl<string, ObjectType<any>, string, TypeParameter[]>,
): Decl[] => getNestedDeclarationsInObjectType(decl.type(...decl.parameters))

export const validateEntityDecl = <Params extends TypeParameter[]>(
  decl: EntityDecl<string, ObjectType<any>, string, Params>,
  args: TypeArguments<Params>,
  value: unknown,
): void =>
  validate(
    replaceTypeArguments(getTypeArgumentsRecord(decl, args), decl.type(...decl.parameters)),
    value,
  )
