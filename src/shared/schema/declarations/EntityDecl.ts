import type { GenericEntityDisplayName } from "../../../node/schema/index.ts"
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

export type KeyPath = string | string[]

export const normalizeKeyPath = (keyPath: KeyPath): string[] =>
  Array.isArray(keyPath) ? keyPath : [keyPath]

export const renderKeyPath = (keyPath: KeyPath): string => normalizeKeyPath(keyPath).join(".")

/**
 * A uniquing element can be the full value of a key or the value of a key in a nested entity map.
 */
export type UniquingElement =
  | { keyPath: KeyPath; keyPathFallback?: KeyPath }
  | { entityMapKeyPath: KeyPath; keyPathInEntityMap: KeyPath; keyPathInEntityMapFallback?: KeyPath }

export type UniqueConstraint = UniquingElement | UniquingElement[]

/**
 * A list of keys or key descriptions whose values need to be unique across all instances in the entity.
 *
 * One or more constraints may be provided. A nested array indicates that the combination of described values must be unique.
 *
 * @example
 *
 * ["name"] // all `name` keys must be unique across the entity
 * ["name", "age"] // all `name` keys and all `age` keys must be unique across the entity
 * [["name", "age"]] // the combination of `name` and `age` must be unique across the entity
 */
export type UniqueConstraints = UniqueConstraint[]

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
