import type { GenericEntityDisplayName } from "../../../node/schema/dsl/index.ts"
import {
  NodeKind,
  resolveSerializedTypeArguments,
  type GetReferencesSerialized,
  type SerializedNode,
  type SerializedTypeArgumentsResolver,
} from "../Node.ts"
import type { SerializedNestedEntityMapType } from "../types/NestedEntityMapType.ts"
import {
  getReferencesForSerializedObjectType,
  type SerializedMemberDecl,
  type SerializedObjectType,
} from "../types/ObjectType.ts"
import type { SerializedStringType } from "../types/StringType.ts"
import type { SortOrder } from "../utils/sortOrder.ts"
import type { UniqueConstraints } from "../utils/uniqueConstraint.ts"
import type { SerializedBaseDecl } from "./Declaration.ts"

export type SerializedEntityDisplayName<T extends TSerializedConstraint> =
  | SerializedPathTo<T, SerializedStringType>
  | {
      /**
       * @default "translations"
       */
      pathToLocaleMap?: SerializedPathTo<T, SerializedNestedEntityMapType>
      /**
       * @default "name"
       */
      pathInLocaleMap?: string
    }
  | null

type TSerializedConstraint = Record<string, SerializedMemberDecl>

type SerializedPathTo<T extends TSerializedConstraint, R> = {
  [K in keyof T]: T[K] extends SerializedMemberDecl<infer V>
    ? V extends R
      ? K
      : R extends V
        ? string
        : T[K] extends SerializedObjectType<infer P>
          ? `${Extract<K, string>}.${SerializedPathTo<P, R>}`
          : never
    : never
}[Extract<keyof T, string>]

export interface SerializedEntityDecl<
  Name extends string = string,
  T extends TSerializedConstraint = TSerializedConstraint,
  FK extends Extract<keyof T, string> | undefined = Extract<keyof T, string> | undefined,
> extends SerializedBaseDecl<Name, []> {
  kind: NodeKind["EntityDecl"]
  namePlural: string

  /**
   * Changes the appearance of the entity’s name in singular form.
   */
  displayName?: string

  /**
   * Changes the appearance of the entity’s name in plural form.
   */
  displayNamePlural?: string
  type: SerializedObjectType<T>
  parentReferenceKey: FK
  /**
   * @default "name"
   */
  instanceDisplayName?: GenericEntityDisplayName
  instanceDisplayNameCustomizer: boolean
  isDeprecated?: boolean
  uniqueConstraints?: UniqueConstraints
  customConstraints: boolean

  /**
   * The order in which instances of an entity are sorted in the editor. This affects entity details pages and reference options.
   */
  sortOrder?: SortOrder
}

export const isSerializedEntityDecl = (node: SerializedNode): node is SerializedEntityDecl =>
  node.kind === NodeKind.EntityDecl

export const isSerializedEntityDeclWithParentReference = <
  Name extends string,
  T extends TSerializedConstraint,
  FK extends Extract<keyof T, string> | undefined,
>(
  decl: SerializedEntityDecl<Name, T, FK>,
): decl is SerializedEntityDecl<Name, T, NonNullable<FK>> => decl.parentReferenceKey !== undefined

export const isSerializedEntityDeclWithoutParentReference = <
  Name extends string,
  T extends TSerializedConstraint,
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
