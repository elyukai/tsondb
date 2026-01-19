import type { SerializedEntityDisplayName } from "../../../shared/schema/declarations/EntityDecl.ts"
import type { SortOrder } from "../../../shared/schema/utils/sortOrder.ts"
import type { UniqueConstraints } from "../../../shared/schema/utils/uniqueConstraint.ts"
import type { InstanceContent } from "../../../shared/utils/instances.ts"
import { Lazy } from "../../../shared/utils/lazy.ts"
import type { CustomConstraint, TypedCustomConstraint } from "../../utils/customConstraints.ts"
import type { DisplayNameCustomizer, TypedDisplayNameCustomizer } from "../../utils/displayName.ts"
import type {
  CustomConstraintValidator,
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  Serialized,
  SerializedMemberDeclObject,
  Serializer,
  TypeArgumentsResolver,
  Validator,
} from "../Node.ts"
import { NodeKind, resolveTypeArguments, validateType } from "../Node.ts"
import type { MemberDecl, ObjectType } from "../types/generic/ObjectType.ts"
import {
  getNestedDeclarationsInObjectType,
  getReferencesForObjectType,
  Required,
  serializeObjectType,
} from "../types/generic/ObjectType.ts"
import { StringType } from "../types/primitives/StringType.ts"
import type { NestedEntityMapType } from "../types/references/NestedEntityMapType.ts"
import { checkCustomConstraintsInType } from "../types/Type.ts"
import type { BaseDecl } from "./Declaration.ts"
import { validateDeclName } from "./Declaration.ts"
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

export const isEntityDecl: Predicate<EntityDecl> = node => node.kind === NodeKind.EntityDecl

export const isEntityDeclWithParentReference = <
  Name extends string,
  T extends TConstraint,
  FK extends Extract<keyof T, string> | undefined,
>(
  decl: EntityDecl<Name, T, FK>,
): decl is EntityDecl<Name, T, NonNullable<FK>> => decl.parentReferenceKey !== undefined

export const getNestedDeclarationsInEntityDecl: GetNestedDeclarations<EntityDecl> = (
  isDeclAdded,
  decl,
) => getNestedDeclarationsInObjectType(isDeclAdded, decl.type.value, decl)

export const validateEntityDecl: Validator<EntityDecl> = (helpers, inDecls, decl, value) =>
  validateType(helpers, inDecls, decl.type.value, value)

export const resolveTypeArgumentsInEntityDecl: TypeArgumentsResolver<EntityDecl> = (
  _args,
  decl,
  inDecl,
) =>
  EntityDecl(decl.sourceUrl, {
    ...decl,
    type: () => resolveTypeArguments({}, decl.type.value, [...inDecl, decl]),
  })

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

export const serializeEntityDecl = (<
  Name extends string,
  T extends TConstraint,
  FK extends Extract<keyof T, string> | undefined,
>(
  type: EntityDecl<Name, T, FK>,
): Serialized<EntityDecl<Name, T, FK>> => ({
  ...type,
  type: serializeObjectType(type.type.value),
  instanceDisplayName: type.instanceDisplayName as SerializedEntityDisplayName<
    SerializedMemberDeclObject<T>
  >,
  instanceDisplayNameCustomizer: type.instanceDisplayNameCustomizer !== undefined,
  customConstraints: type.customConstraints !== undefined,
})) satisfies Serializer<EntityDecl>

export const getReferencesForEntityDecl: GetReferences<EntityDecl> = (decl, value, inDecl) =>
  getReferencesForObjectType(decl.type.value, value, [...inDecl, decl])

export const checkCustomConstraintsInEntityDecl: CustomConstraintValidator<
  EntityDecl,
  [id: string, content: InstanceContent]
> = (decl, value, helpers) =>
  (
    decl.customConstraints?.({ ...helpers, instanceId: value[0], instanceContent: value[1] }) ?? []
  ).concat(checkCustomConstraintsInType(decl.type.value, value, helpers))
