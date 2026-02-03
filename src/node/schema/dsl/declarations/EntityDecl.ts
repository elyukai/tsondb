import { Lazy } from "@elyukai/utils/lazy"
import { NodeKind } from "../../../../shared/schema/Node.js"
import type { SortOrder } from "../../../../shared/schema/utils/sortOrder.ts"
import type { UniqueConstraints } from "../../../../shared/schema/utils/uniqueConstraint.ts"
import type { CustomConstraint, TypedCustomConstraint } from "../../../utils/customConstraints.ts"
import type {
  DisplayNameCustomizer,
  TypedDisplayNameCustomizer,
} from "../../../utils/displayName.ts"
import type { Node } from "../index.ts"
import type { NestedEntityMapType } from "../types/NestedEntityMapType.ts"
import type { MemberDecl, ObjectType } from "../types/ObjectType.ts"
import { Required } from "../types/ObjectType.ts"
import { StringType } from "../types/StringType.ts"
import type { BaseDecl } from "./Decl.ts"
import { validateDeclName } from "./Decl.ts"
import { TypeAliasDecl } from "./TypeAliasDecl.ts"

export type GenericEntityDisplayName =
  | string
  | { pathToLocaleMap?: string; pathInLocaleMap?: string }
  | null

export type EntityDisplayName<T extends TConstraint> =
  | PathTo<T, StringType>
  | {
      /**
       * @default "translations"
       */
      pathToLocaleMap?: PathTo<T, NestedEntityMapType>
      /**
       * @default "name"
       */
      pathInLocaleMap?: string
    }
  | null

type TConstraint = Record<string, MemberDecl>

type PathTo<T extends TConstraint, R> = {
  [K in keyof T]: T[K] extends MemberDecl<infer V>
    ? V extends R
      ? K
      : R extends V
        ? string
        : T[K] extends ObjectType<infer P>
          ? `${Extract<K, string>}.${PathTo<P, R>}`
          : never
    : never
}[Extract<keyof T, string>]

export interface EntityDecl<
  Name extends string = string,
  T extends TConstraint = TConstraint,
  FK extends Extract<keyof T, string> | undefined = Extract<keyof T, string> | undefined,
> extends BaseDecl<Name, []> {
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
  type: Lazy<ObjectType<T>>
  parentReferenceKey: FK

  /**
   * Sets the property used to retrieve the display name of an instance in editor forms (such as when selecting a reference) and error messages.
   * @default "name"
   */
  instanceDisplayName?: GenericEntityDisplayName

  /**
   * A function that is used to further customize the display name of an instance.
   */
  instanceDisplayNameCustomizer?: DisplayNameCustomizer
  isDeprecated?: boolean
  uniqueConstraints?: UniqueConstraints
  customConstraints?: CustomConstraint

  /**
   * The order in which instances of an entity are sorted in the editor. This affects entity details pages and reference options.
   */
  sortOrder?: SortOrder
}

export interface EntityDeclWithParentReference<
  Name extends string = string,
  T extends TConstraint = TConstraint,
  FK extends Extract<keyof T, string> = Extract<keyof T, string>,
> extends EntityDecl<Name, T, FK> {}

export const EntityDecl: {
  <Name extends string, T extends TConstraint>(
    sourceUrl: string,
    options: {
      name: Name
      namePlural: string

      /**
       * Changes the appearance of the entity’s name in singular form.
       */
      displayName?: string

      /**
       * Changes the appearance of the entity’s name in plural form.
       */
      displayNamePlural?: string
      comment?: string
      type: () => ObjectType<T>

      /**
       * Sets the property used to retrieve the display name of an instance in editor forms (such as when selecting a reference) and error messages.
       * @default "name"
       */
      instanceDisplayName?: EntityDisplayName<T>

      /**
       * A function that is used to further customize the display name of an instance.
       */
      instanceDisplayNameCustomizer?: TypedDisplayNameCustomizer<Name>
      isDeprecated?: boolean
      uniqueConstraints?: UniqueConstraints
      customConstraints?: TypedCustomConstraint<Name>

      /**
       * The order in which instances of an entity are sorted in the editor. This affects entity details pages and reference options.
       */
      sortOrder?: SortOrder
    },
  ): EntityDecl<Name, T, undefined>
  <Name extends string, T extends TConstraint, FK extends Extract<keyof T, string>>(
    sourceUrl: string,
    options: {
      name: Name
      namePlural: string

      /**
       * Changes the appearance of the entity’s name in singular form.
       */
      displayName?: string

      /**
       * Changes the appearance of the entity’s name in plural form.
       */
      displayNamePlural?: string
      comment?: string
      type: () => ObjectType<T>
      parentReferenceKey: FK

      /**
       * Sets the property used to retrieve the display name of an instance in editor forms (such as when selecting a reference) and error messages.
       * @default "name"
       */
      instanceDisplayName?: EntityDisplayName<T>

      /**
       * A function that is used to further customize the display name of an instance.
       */
      instanceDisplayNameCustomizer?: TypedDisplayNameCustomizer<Name>
      isDeprecated?: boolean
      uniqueConstraints?: UniqueConstraints
      customConstraints?: TypedCustomConstraint<Name>

      /**
       * The order in which instances of an entity are sorted in the editor. This affects entity details pages and reference options.
       */
      sortOrder?: SortOrder
    },
  ): EntityDecl<Name, T, FK>
} = <Name extends string, T extends TConstraint, FK extends Extract<keyof T, string> | undefined>(
  sourceUrl: string,
  options: {
    name: Name
    namePlural: string

    /**
     * Changes the appearance of the entity’s name in singular form.
     */
    displayName?: string

    /**
     * Changes the appearance of the entity’s name in plural form.
     */
    displayNamePlural?: string
    comment?: string
    type: () => ObjectType<T>
    parentReferenceKey?: FK

    /**
     * Sets the property used to retrieve the display name of an instance in editor forms (such as when selecting a reference) and error messages.
     * @default "name"
     */
    instanceDisplayName?: EntityDisplayName<T>

    /**
     * A function that is used to further customize the display name of an instance.
     */
    instanceDisplayNameCustomizer?: TypedDisplayNameCustomizer<Name>
    isDeprecated?: boolean
    uniqueConstraints?: UniqueConstraints
    customConstraints?: TypedCustomConstraint<Name>

    /**
     * The order in which instances of an entity are sorted in the editor. This affects entity details pages and reference options.
     */
    sortOrder?: SortOrder
  },
): EntityDecl<Name, T, FK> => {
  validateDeclName(options.name)

  return {
    ...options,
    instanceDisplayNameCustomizer: options.instanceDisplayNameCustomizer as DisplayNameCustomizer, // ignore contravariance of registered entity type
    customConstraints: options.customConstraints as CustomConstraint, // ignore contravariance of registered entity type
    kind: NodeKind.EntityDecl,
    sourceUrl,
    parameters: [],
    type: Lazy.of(() => {
      const type = options.type()
      Object.keys(type.properties).forEach(key => {
        if (key === "id") {
          throw new TypeError(
            `Invalid object key "${key}" for entity "${options.name}". The key "id" is reserved for the entity identifier.`,
          )
        }
      })
      return type
    }),
    parentReferenceKey: options.parentReferenceKey as FK,
  }
}

export { EntityDecl as Entity }

export const isEntityDecl = (node: Node): node is EntityDecl => node.kind === NodeKind.EntityDecl

export const isEntityDeclWithParentReference = <
  Name extends string,
  T extends TConstraint,
  FK extends Extract<keyof T, string> | undefined,
>(
  decl: EntityDecl<Name, T, FK>,
): decl is EntityDecl<Name, T, NonNullable<FK>> => decl.parentReferenceKey !== undefined

const createEntityIdentifierComment = () =>
  "The entity’s identifier. A UUID or a locale code if it is registered as the locale entity."

export const addEphemeralUUIDToType = <T extends TConstraint>(
  decl: EntityDecl<string, T>,
): ObjectType<Omit<T, "id"> & { id: MemberDecl<StringType, true> }> => ({
  ...decl.type.value,
  properties: {
    id: Required({
      comment: createEntityIdentifierComment(),
      type: createEntityIdentifierType(),
    }),
    ...(Object.fromEntries(
      Object.entries(decl.type.value.properties).filter(([key]) => key !== "id"),
    ) as Omit<T, "id">),
  },
})

export const createEntityIdentifierType = () => StringType()

export const createEntityIdentifierTypeAsDecl = <Name extends string>(decl: EntityDecl<Name>) =>
  TypeAliasDecl(decl.sourceUrl, {
    comment: createEntityIdentifierComment(),
    name: (decl.name + "_ID") as `${Name}_ID`,
    type: createEntityIdentifierType,
  })
