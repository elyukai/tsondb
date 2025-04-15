import { Lazy } from "../../utils/lazy.js"
import { Node, NodeKind } from "../Node.js"
import {
  getNestedDeclarationsInObjectType,
  ObjectType,
  RequiredProperties,
  resolveTypeArgumentsInObjectType,
} from "../types/generic/ObjectType.js"
import { validate } from "../types/Type.js"
import { validateOption } from "../validation/options.js"
import { ValidatorHelpers } from "../validation/type.js"
import { BaseDecl, GetNestedDeclarations, validateDeclName } from "./Declaration.js"

export interface EntityDecl<
  Name extends string = string,
  T extends ObjectType = ObjectType,
  PK extends RequiredProperties<T["properties"]> & string = RequiredProperties<T["properties"]> &
    string,
> extends BaseDecl<Name, []> {
  kind: typeof NodeKind.EntityDecl
  type: Lazy<T>
  primaryKey: PK[]
}

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
): EntityDecl<Name, T, PK> => {
  validateDeclName(options.name)

  const decl: EntityDecl<Name, T, PK> = {
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

export const isEntityDecl = (node: Node): node is EntityDecl => node.kind === NodeKind.EntityDecl

export const getNestedDeclarationsInEntityDecl: GetNestedDeclarations<EntityDecl> = (
  isDeclAdded,
  decl,
) => getNestedDeclarationsInObjectType(isDeclAdded, decl.type.value)

export const validateEntityDecl = (
  helpers: ValidatorHelpers,
  decl: EntityDecl,
  value: unknown,
): Error[] => validate(helpers, decl.type.value, value)
