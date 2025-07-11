import { Lazy } from "../../../shared/utils/lazy.js"
import type { Leaves } from "../../../shared/utils/object.js"
import type { GetReferences, Node, Serializer } from "../Node.js"
import { NodeKind } from "../Node.js"
import type { MemberDecl, ObjectType, SerializedObjectType } from "../types/generic/ObjectType.js"
import {
  getNestedDeclarationsInObjectType,
  getReferencesForObjectType,
  Required,
  resolveTypeArgumentsInObjectType,
  serializeObjectType,
} from "../types/generic/ObjectType.js"
import { StringType } from "../types/primitives/StringType.js"
import type { AsType, SerializedAsType } from "../types/Type.js"
import { setParent, validate } from "../types/Type.js"
import type { ValidatorHelpers } from "../validation/type.js"
import type { BaseDecl, GetNestedDeclarations, SerializedBaseDecl } from "./Declaration.js"
import { validateDeclName } from "./Declaration.js"
import { TypeAliasDecl } from "./TypeAliasDecl.js"

export interface EntityDecl<Name extends string = string, T extends ObjectType = ObjectType>
  extends BaseDecl<Name, []> {
  kind: NodeKind["EntityDecl"]
  namePlural: string
  type: Lazy<T>
  /**
   * @default "name"
   */
  displayName?:
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
  isDeprecated?: boolean
}

export interface SerializedEntityDecl<
  Name extends string = string,
  T extends SerializedObjectType = SerializedObjectType,
> extends SerializedBaseDecl<Name, []> {
  kind: NodeKind["EntityDecl"]
  namePlural: string
  type: T
  /**
   * @default "name"
   */
  displayName?:
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
    displayName?:
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
    isDeprecated?: boolean
  },
): EntityDecl<Name, T> => {
  validateDeclName(options.name)

  const decl: EntityDecl<Name, T> = {
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
      return setParent(type, decl)
    }),
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

export const resolveTypeArgumentsInEntityDecl = (decl: EntityDecl): EntityDecl =>
  EntityDecl(decl.sourceUrl, {
    ...decl,
    type: () => resolveTypeArgumentsInObjectType({}, decl.type.value),
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

export const serializeEntityDecl: Serializer<EntityDecl, SerializedEntityDecl> = type => ({
  ...type,
  type: serializeObjectType(type.type.value),
})

export const getReferencesForEntityDecl: GetReferences<EntityDecl> = (decl, value) =>
  getReferencesForObjectType(decl.type.value, value)
