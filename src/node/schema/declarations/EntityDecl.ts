import { Lazy } from "../../../shared/utils/lazy.ts"
import type { Leaves } from "../../../shared/utils/object.ts"
import type {
  GetNestedDeclarations,
  GetReferences,
  Predicate,
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
import type { AsType } from "../types/Type.ts"
import type { BaseDecl } from "./Declaration.ts"
import { validateDeclName } from "./Declaration.ts"
import { TypeAliasDecl } from "./TypeAliasDecl.ts"

export type GenericDisplayNameFn = (
  instance: unknown,
  instanceDisplayName: string,
  getInstanceById: (id: string) => unknown,
  getDisplayNameForInstanceId: (id: string) => string | undefined,
  locales: string[] | undefined,
) => string

export type GenericEntityDisplayName =
  | string
  | { pathToLocaleMap?: string; pathInLocaleMap?: string }
  | null

export type DisplayNameFn<T extends ObjectType = ObjectType> = (
  instance: AsType<T>,
  instanceDisplayName: string,
  getInstanceById: (id: string) => unknown,
  getDisplayNameForInstanceId: (id: string) => string | undefined,
  locales: string[] | undefined,
) => string

export type EntityDisplayName<T extends ObjectType> =
  | Leaves<AsType<T>>
  | {
      /**
       * @default "translations"
       */
      pathToLocaleMap?: Leaves<AsType<T>>
      /**
       * @default "name"
       */
      pathInLocaleMap?: string
    }
  | null

export interface EntityDecl<Name extends string = string, T extends ObjectType = ObjectType>
  extends BaseDecl<Name, []> {
  kind: NodeKind["EntityDecl"]
  namePlural: string
  type: Lazy<T>
  /**
   * @default "name"
   */
  displayName?: EntityDisplayName<T>
  displayNameCustomizer?: DisplayNameFn<T>
  isDeprecated?: boolean
}

export const EntityDecl = <Name extends string, T extends ObjectType>(
  sourceUrl: string,
  options: {
    name: Name
    namePlural: string
    comment?: string
    type: () => T
    /**
     * @default "name"
     */
    displayName?: EntityDisplayName<T>
    displayNameCustomizer?: DisplayNameFn<T>
    isDeprecated?: boolean
  },
): EntityDecl<Name, T> => {
  validateDeclName(options.name)

  return {
    ...options,
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
  }
}

export { EntityDecl as Entity }

export const isEntityDecl: Predicate<EntityDecl> = node => node.kind === NodeKind.EntityDecl

export const getNestedDeclarationsInEntityDecl: GetNestedDeclarations<EntityDecl> = (
  isDeclAdded,
  decl,
) => getNestedDeclarationsInObjectType(isDeclAdded, decl.type.value)

export const validateEntityDecl: Validator<EntityDecl> = (helpers, decl, value) =>
  validateType(helpers, decl.type.value, value)

export const resolveTypeArgumentsInEntityDecl: TypeArgumentsResolver<EntityDecl> = (_args, decl) =>
  EntityDecl(decl.sourceUrl, {
    ...decl,
    type: () => resolveTypeArguments({}, decl.type.value),
  })

const createEntityIdentifierComment = () =>
  "The entity’s identifier. A UUID or a locale code if it is registered as the locale entity."

export const addEphemeralUUIDToType = <T extends Record<string, MemberDecl>>(
  decl: EntityDecl<string, ObjectType<T>>,
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

export const serializeEntityDecl: Serializer<EntityDecl> = type => ({
  ...type,
  type: serializeObjectType(type.type.value),
  displayName: typeof type.displayName === "function" ? null : type.displayName,
  displayNameCustomizer: type.displayNameCustomizer !== undefined,
})

export const getReferencesForEntityDecl: GetReferences<EntityDecl> = (decl, value) =>
  getReferencesForObjectType(decl.type.value, value)
