import { isUniqueOnWithResult } from "../../../shared/utils/array.ts"
import { deepEqual } from "../../../shared/utils/compare.ts"
import { Lazy } from "../../../shared/utils/lazy.ts"
import type { Leaves } from "../../../shared/utils/object.ts"
import type { GetReferences, Node, Serializer } from "../Node.ts"
import { NodeKind } from "../Node.ts"
import type { MemberDecl, ObjectType, SerializedObjectType } from "../types/generic/ObjectType.ts"
import {
  getNestedDeclarationsInObjectType,
  getReferencesForObjectType,
  Required,
  resolveTypeArgumentsInObjectType,
  serializeObjectType,
} from "../types/generic/ObjectType.ts"
import { StringType } from "../types/primitives/StringType.ts"
import type { AsType, SerializedAsType } from "../types/Type.ts"
import { setParent, validate } from "../types/Type.ts"
import type { ValidatorHelpers } from "../validation/type.ts"
import type { BaseDecl, GetNestedDeclarations, SerializedBaseDecl } from "./Declaration.ts"
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
  unique?: (keyof T["properties"] | (keyof T["properties"])[])[]
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
  displayName?: SerializedEntityDisplayName<T>
  isDeprecated?: boolean
  unique?: (keyof T["properties"] | (keyof T["properties"])[])[]
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
    unique?: (keyof T["properties"] | (keyof T["properties"])[])[]
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
      return setParent(type, decl as unknown as EntityDecl)
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
  displayName: typeof type.displayName === "function" ? null : type.displayName,
})

export const getReferencesForEntityDecl: GetReferences<EntityDecl> = (decl, value) =>
  getReferencesForObjectType(decl.type.value, value)

export const checkEntityInstancesUniquenessConstraint = <T extends ObjectType>(
  decl: EntityDecl<string, T>,
  instances: unknown[],
): [firstIndex: number, secondIndex: number, error: TypeError][] =>
  decl.unique?.flatMap(
    (uniqueKeyOrKeys): [firstIndex: number, secondIndex: number, error: TypeError][] => {
      const uniqueKeys = Array.isArray(uniqueKeyOrKeys) ? uniqueKeyOrKeys : [uniqueKeyOrKeys]

      const uniquenessViolations = isUniqueOnWithResult(
        instances,
        instance =>
          uniqueKeys.map(
            (key): unknown => (instance as Record<keyof T["properties"], unknown>)[key],
          ),
        deepEqual,
      )

      return uniquenessViolations.map(([firstIndex, secondIndex]) => [
        firstIndex,
        secondIndex,
        new TypeError(
          Array.isArray(uniqueKeyOrKeys)
            ? `entity "${decl.name}" must be unique in the combination of fields [${uniqueKeys.join(
                ", ",
              )}]. Duplicate combination found: ${uniqueKeys.map(key => String(key) + ": " + JSON.stringify((instances[firstIndex] as Record<keyof T["properties"], unknown>)[key])).join(", ")}.`
            : `entity "${decl.name}" must be unique in field "${String(uniqueKeyOrKeys)}". Duplicate value found: ${JSON.stringify((instances[firstIndex] as Record<keyof T["properties"], unknown>)[uniqueKeyOrKeys])}.`,
        ),
      ])
    },
  ) ?? []

export const checkEntityUniquenessConstraintForSingleInstance = <T extends ObjectType>(
  decl: EntityDecl<string, T>,
  instances: unknown[],
  instance: unknown,
): [index: number, error: TypeError][] =>
  decl.unique
    ?.map((uniqueKeyOrKeys): [index: number, error: TypeError] | undefined => {
      const uniqueKeys = Array.isArray(uniqueKeyOrKeys) ? uniqueKeyOrKeys : [uniqueKeyOrKeys]

      const mapFn = (instance: unknown) =>
        uniqueKeys.map((key): unknown => (instance as Record<keyof T["properties"], unknown>)[key])

      const mappedInstance = mapFn(instance)
      const existingIndex = instances
        .map(mapFn)
        .findIndex(other => deepEqual(other, mappedInstance))

      if (existingIndex === -1) {
        return undefined
      }

      return [
        existingIndex,
        new TypeError(
          Array.isArray(uniqueKeyOrKeys)
            ? `entity "${decl.name}" must be unique in the combination of fields [${uniqueKeys.join(
                ", ",
              )}]. Duplicate combination found: ${uniqueKeys.map(key => String(key) + ": " + JSON.stringify((instance as Record<keyof T["properties"], unknown>)[key])).join(", ")}.`
            : `entity "${decl.name}" must be unique in field "${String(uniqueKeyOrKeys)}". Duplicate value found: ${JSON.stringify((instance as Record<keyof T["properties"], unknown>)[uniqueKeyOrKeys])}.`,
        ),
      ]
    })
    .filter(x => x !== undefined) ?? []
