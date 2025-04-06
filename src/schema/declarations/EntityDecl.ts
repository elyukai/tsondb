import { Lazy } from "../../utils/lazy.js"
import { Node, NodeKind, Validators } from "../Node.js"
import { TypeParameter } from "../parameters/TypeParameter.js"
import {
  getNestedDeclarationsInObjectType,
  MemberDecl,
  ObjectType,
  RequiredProperties,
} from "../types/generic/ObjectType.js"
import { replaceTypeArguments, Type, validate } from "../types/Type.js"
import { validateOption } from "../validation/options.js"
import { BaseDecl, Decl, getTypeArgumentsRecord, TypeArguments } from "./Declaration.js"

export interface EntityDecl<
  Name extends string = string,
  T extends ObjectType<Record<string, MemberDecl<Type, true>>> = ObjectType<
    Record<string, MemberDecl<Type, true>>
  >,
  PK extends RequiredProperties<T["properties"]> & string = RequiredProperties<T["properties"]> &
    string,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: typeof NodeKind.EntityDecl
  type: Lazy<T>
  primaryKey: PK[]
}

export const GenEntity = <
  Name extends string,
  T extends ObjectType<Record<string, MemberDecl<Type, true>>>,
  PK extends RequiredProperties<T["properties"]> & string,
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
): EntityDecl<Name, T, PK, Params> => {
  const decl: EntityDecl<Name, T, PK, Params> = {
    kind: NodeKind.EntityDecl,
    sourceUrl,
    ...options,
    type: Lazy.of(() => {
      const type = options.type(...options.parameters)
      type.parent = decl as unknown as Decl
      return type
    }),
    primaryKey: Array.isArray(options.primaryKey) ? options.primaryKey : [options.primaryKey],
  }

  return decl
}

export const Entity = <
  Name extends string,
  T extends ObjectType<Record<string, MemberDecl<Type, true>>>,
  PK extends RequiredProperties<T["properties"]> & string,
>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    type: () => T
    primaryKey: PK | PK[]
  },
): EntityDecl<Name, T, PK, []> => {
  const decl: EntityDecl<Name, T, PK, []> = {
    kind: NodeKind.EntityDecl,
    sourceUrl,
    ...options,
    parameters: [],
    type: Lazy.of(() => {
      const type = options.type()
      type.parent = decl
      return type
    }),
    primaryKey: Array.isArray(options.primaryKey)
      ? validateOption(options.primaryKey, "primaryKey", arr => arr.length > 0)
      : [options.primaryKey],
  }

  return decl
}

export const isEntityDecl = (
  node: Node,
): node is EntityDecl<string, ObjectType<any>, string, TypeParameter[]> =>
  node.kind === NodeKind.EntityDecl

export const getNestedDeclarationsInEntityDecl = (
  decl: EntityDecl<string, ObjectType<any>, string, TypeParameter[]>,
): Decl[] => getNestedDeclarationsInObjectType(decl.type.value)

export const validateEntityDecl = <Params extends TypeParameter[]>(
  validators: Validators,
  decl: EntityDecl<string, ObjectType<any>, string, Params>,
  args: TypeArguments<Params>,
  value: unknown,
): void =>
  validate(
    validators,
    replaceTypeArguments(getTypeArgumentsRecord(decl, args), decl.type.value),
    value,
  )
