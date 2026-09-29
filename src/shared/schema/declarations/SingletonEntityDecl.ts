import {
  NodeKind,
  resolveSerializedTypeArguments,
  type GetReferencesSerialized,
  type SerializedNode,
  type SerializedTypeArgumentsResolver,
} from "../Node.ts"
import {
  getReferencesForSerializedObjectType,
  type SerializedMemberDecl,
  type SerializedObjectType,
} from "../types/ObjectType.ts"
import type { SerializedBaseDecl } from "./Declaration.ts"

type TSerializedConstraint = Record<string, SerializedMemberDecl>

export interface SerializedSingletonEntityDecl<
  Name extends string = string,
  T extends TSerializedConstraint = TSerializedConstraint,
> extends SerializedBaseDecl<Name, []> {
  kind: NodeKind["SingletonEntityDecl"]

  /**
   * Changes the appearance of the entity’s name in singular form.
   */
  displayName?: string
  type: SerializedObjectType<T>
  isDeprecated?: boolean
  customConstraints: boolean
}

export const isSerializedSingletonEntityDecl = (
  node: SerializedNode,
): node is SerializedSingletonEntityDecl => node.kind === NodeKind.SingletonEntityDecl

export const resolveTypeArgumentsInSerializedSingletonEntityDecl: SerializedTypeArgumentsResolver<
  SerializedSingletonEntityDecl
> = (decls, _args, decl) => ({
  ...decl,
  type: resolveSerializedTypeArguments(decls, {}, decl.type),
})

export const getReferencesForSerializedSingletonEntityDecl: GetReferencesSerialized<
  SerializedSingletonEntityDecl
> = (decls, decl, value) => getReferencesForSerializedObjectType(decls, decl.type, value)
