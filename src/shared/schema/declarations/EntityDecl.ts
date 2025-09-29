import type { Leaves } from "../../../shared/utils/object.ts"
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
import type { SerializedAsType } from "../types/Type.ts"
import type { SerializedBaseDecl } from "./Declaration.ts"

export type SerializedEntityDisplayName<T extends SerializedObjectType> =
  | Leaves<SerializedAsType<T>>
  | {
      /**
       * @default "translations"
       */
      pathToLocaleMap?: Leaves<SerializedAsType<T>>
      /**
       * @default "name"
       */
      pathInLocaleMap?: string
    }
  | null

type TConstraint = Record<string, SerializedMemberDecl>

export interface SerializedEntityDecl<
  Name extends string = string,
  T extends TConstraint = TConstraint,
  FK extends (keyof T & string) | undefined = (keyof T & string) | undefined,
> extends SerializedBaseDecl<Name, []> {
  kind: NodeKind["EntityDecl"]
  namePlural: string
  type: SerializedObjectType<T>
  parentReferenceKey: FK
  /**
   * @default "name"
   */
  displayName?: SerializedEntityDisplayName<SerializedObjectType<T>>
  displayNameCustomizer: boolean
  isDeprecated?: boolean
}

export const isSerializedEntityDecl = (node: SerializedNode): node is SerializedEntityDecl =>
  node.kind === NodeKind.EntityDecl

export const resolveTypeArgumentsInSerializedEntityDecl: SerializedTypeArgumentsResolver<
  SerializedEntityDecl
> = (decls, _args, decl) => ({
  ...decl,
  type: resolveSerializedTypeArguments(decls, {}, decl.type),
})

export const getReferencesForSerializedEntityDecl: GetReferencesSerialized<SerializedEntityDecl> = (
  decls,
  decl,
  value,
) => getReferencesForSerializedObjectType(decls, decl.type, value)
