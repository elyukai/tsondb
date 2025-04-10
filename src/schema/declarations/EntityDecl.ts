import { Lazy } from "../../utils/lazy.js"
import { Node, NodeKind } from "../Node.js"
import { TypeParameter } from "../parameters/TypeParameter.js"
import {
  getNestedDeclarationsInObjectType,
  ObjectType,
  RequiredProperties,
} from "../types/generic/ObjectType.js"
import { replaceTypeArguments, validate } from "../types/Type.js"
import { validateOption } from "../validation/options.js"
import { ValidatorHelpers } from "../validation/type.js"
import {
  BaseDecl,
  Decl,
  GetNestedDeclarations,
  getTypeArgumentsRecord,
  TypeArguments,
} from "./Declaration.js"

export interface EntityDecl<
  Name extends string = string,
  T extends ObjectType = ObjectType,
  PK extends RequiredProperties<T["properties"]> & string = RequiredProperties<T["properties"]> &
    string,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: typeof NodeKind.EntityDecl
  type: Lazy<T>
  primaryKey: PK[]
}

export const GenEntityDecl = <
  Name extends string,
  T extends ObjectType,
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

export { GenEntityDecl as GenEntity }

export const EntityDecl = <
  Name extends string,
  T extends ObjectType,
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

export { EntityDecl as Entity }

export const isEntityDecl = (
  node: Node,
): node is EntityDecl<string, ObjectType<any>, string, TypeParameter[]> =>
  node.kind === NodeKind.EntityDecl

export const getNestedDeclarationsInEntityDecl: GetNestedDeclarations<EntityDecl> = (
  isDeclAdded,
  decl,
) => getNestedDeclarationsInObjectType(isDeclAdded, decl.type.value)

export const validateEntityDecl = <Params extends TypeParameter[]>(
  helpers: ValidatorHelpers,
  decl: EntityDecl<string, ObjectType<any>, string, Params>,
  args: TypeArguments<Params>,
  value: unknown,
): Error[] =>
  validate(
    helpers,
    replaceTypeArguments(getTypeArgumentsRecord(decl, args), decl.type.value),
    value,
  )
