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
  FK extends Extract<keyof T, string> | undefined = Extract<keyof T, string> | undefined,
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

export const isSerializedEntityDeclWithParentReference = <
  Name extends string,
  T extends TConstraint,
  FK extends Extract<keyof T, string> | undefined,
>(
  decl: SerializedEntityDecl<Name, T, FK>,
): decl is SerializedEntityDecl<Name, T, NonNullable<FK>> => decl.parentReferenceKey !== undefined

export const isSerializedEntityDeclWithoutParentReference = <
  Name extends string,
  T extends TConstraint,
>(
  decl: SerializedEntityDecl<Name, T>,
): decl is SerializedEntityDecl<Name, T, undefined> => decl.parentReferenceKey === undefined

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
