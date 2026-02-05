/**
 * Types for commonly used functions for registering and retrieving typed instances.
 * @module
 */

import { ENUM_DISCRIMINATOR_KEY } from "../../shared/schema/declarations/EnumDecl.ts"
import type { DisplayNameResult } from "../../shared/utils/displayName.ts"
import type {
  InstanceContainer,
  InstanceContainerOverview,
  InstanceContent,
} from "../../shared/utils/instances.ts"
import type { DeclarationName, DefaultTSONDBTypes } from "../index.ts"
import type { EntityDecl } from "./dsl/declarations/EntityDecl.ts"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- used to register generated types
export interface Register {}

export type AnyEntityMap = Record<string, InstanceContent>

export type RegisteredEntityMap<T = Register> = T extends { entityMap: AnyEntityMap }
  ? T["entityMap"]
  : AnyEntityMap

export type RegisteredEntity<Name extends string, T = Register> = T extends {
  entityMap: { [K in Name]: InstanceContent }
}
  ? T["entityMap"][Name]
  : InstanceContent

export type AnyChildEntityMap = Record<
  string,
  [content: InstanceContent, parentKey: string, parentValue: string | object]
>

export type RegisteredChildEntityMap<T = Register> = T extends { childEntityMap: AnyChildEntityMap }
  ? T["childEntityMap"]
  : AnyChildEntityMap

type EnumContent = object

export type AnyEnumMap = Record<string, EnumContent>

export type RegisteredEnumMap<T = Register> = T extends { enumMap: AnyEnumMap }
  ? T["enumMap"]
  : AnyEnumMap

export type RegisteredEnum<Name extends string, T = Register> = T extends {
  enumMap: { [K in Name]: EnumContent }
}
  ? T["enumMap"][Name]
  : EnumContent

type TypeAliasContent = unknown

export type AnyTypeAliasMap = Record<string, TypeAliasContent>

export type RegisteredTypeAliasMap<T = Register> = T extends { typeAliasMap: AnyTypeAliasMap }
  ? T["typeAliasMap"]
  : AnyTypeAliasMap

export type RegisteredTypeAlias<Name extends string, T = Register> = T extends {
  typeAliasMap: { [K in Name]: TypeAliasContent }
}
  ? T["typeAliasMap"][Name]
  : TypeAliasContent

export type RegisteredEnumOrTypeAlias<
  Name extends string,
  T = Register,
> = RegisteredEnumMap extends { [K in Name]: unknown }
  ? RegisteredEnum<Name, T>
  : RegisteredTypeAlias<Name, T>

/**
 * Creates an enum case object.
 */
export const Case = (<T extends string, V>(type: T, value: V): Case<T, V> =>
  (value === undefined
    ? { [ENUM_DISCRIMINATOR_KEY]: type }
    : { [ENUM_DISCRIMINATOR_KEY]: type, [type]: value }) as Case<T, V>) as {
  <T extends string>(type: T): Case<T>
  <T extends string, V extends NonNullable<unknown> | null>(type: T, value: V): Case<T, V>
}

/**
 * Type representing an enum case object.
 */
export type Case<K extends string, T = undefined> = {
  [P in K]: T extends NonNullable<unknown> | null
    ? { [Key in ENUM_DISCRIMINATOR_KEY]: P } & {
        [Key in P]: Extract<T, NonNullable<unknown> | null>
      }
    : { [Key in ENUM_DISCRIMINATOR_KEY]: P }
}[K]

/**
 * A single instance might be defined by entity and identifier separately or by
 * them being wrapped in an enum case.
 */
export type IdArgsVariant<
  T extends AnyEntityMap = RegisteredEntityMap,
  E extends Extract<keyof T, string> = Extract<keyof T, string>,
> = [entity: E, id: string] | [enumCase: Case<E, string>]

/**
 * Normalizes entity-identifier arguments into an object.
 *
 * In a lot of places, an instance can be specified by a pair of the entity name and the identifier itself. They may be passed as either two separate arguments or wrapped in an enum case object. This function normalizes both forms into a consistent object structure.
 */
export const normalizedIdArgs = <
  T extends AnyEntityMap = RegisteredEntityMap,
  E extends Extract<keyof T, string> = Extract<keyof T, string>,
>(
  args: IdArgsVariant<T, E>,
): { entityName: E; id: string } => {
  if (typeof args[0] === "object") {
    const [enumCase] = args
    return {
      entityName: enumCase[ENUM_DISCRIMINATOR_KEY],
      id: enumCase[enumCase[ENUM_DISCRIMINATOR_KEY]],
    }
  } else {
    const [entityName, id] = args as [E, string]
    return { entityName, id }
  }
}

/**
 * A function that retrieves an instance by its entity and identifier.
 */
export type GetInstanceById<T extends AnyEntityMap = RegisteredEntityMap> = <
  E extends Extract<keyof T, string> = Extract<keyof T, string>,
>(
  ...args: IdArgsVariant<T, E>
) => T[E] | undefined

/**
 * A function that retrieves an instance container by its entity and identifier.
 */
export type GetInstanceContainerById<T extends AnyEntityMap = RegisteredEntityMap> = <
  E extends Extract<keyof T, string> = Extract<keyof T, string>,
>(
  ...args: IdArgsVariant<T, E>
) => InstanceContainer<T[E]> | undefined

/**
 * A function that retrieves an instance container by its entity and identifier.
 */
export type GetInstanceOverviewOfEntityById<T extends AnyEntityMap = RegisteredEntityMap> = <
  E extends Extract<keyof T, string> = Extract<keyof T, string>,
>(
  ...args: IdArgsVariant<T, E>
) => InstanceContainerOverview | undefined

/**
 * A function that retrieves all instances of a given entity.
 */
export type GetAllInstances<T extends AnyEntityMap = RegisteredEntityMap> = <
  E extends Extract<keyof T, string> = Extract<keyof T, string>,
>(
  entity: E,
) => T[E][]

/**
 * A function that retrieves all instance containers of a given entity.
 */
export type GetAllInstanceContainers<T extends AnyEntityMap = RegisteredEntityMap> = <
  E extends Extract<keyof T, string> = Extract<keyof T, string>,
>(
  entity: E,
) => InstanceContainer<T[E]>[]

/**
 * A function that retrieves all instances of a given child entity for a given parent instance.
 */
export type GetAllChildInstancesForParent<T extends AnyChildEntityMap = RegisteredChildEntityMap> =
  <E extends Extract<keyof T, string> = Extract<keyof T, string>>(
    entity: E,
    parentId: T[E][2],
  ) => T[E][0][]

/**
 * A function that retrieves all instance containers of a given child entity for a given parent instance.
 */
export type GetAllChildInstanceContainersForParent<
  T extends AnyChildEntityMap = RegisteredChildEntityMap,
> = <E extends Extract<keyof T, string> = Extract<keyof T, string>>(
  entity: E,
  parentId: T[E][2],
) => InstanceContainer<T[E][0]>[]

/**
 * Displays the name of an entity instance including its ID. If no display name is found, `undefined` is returned.
 */
export type GetDisplayName<T extends AnyEntityMap = RegisteredEntityMap> = (
  ...args: IdArgsVariant<T>
) => string | undefined

/**
 * Displays the name of an entity instance with the used locale identifier, if any.
 */
export type GetDisplayNameWithLocaleId<T extends AnyEntityMap = RegisteredEntityMap> = (
  ...args: IdArgsVariant<T>
) => DisplayNameResult | undefined

/**
 * Displays the name of an entity instance including its ID. If no display name is found, only the ID is returned.
 */
export type GetDisplayNameAndId<T extends AnyEntityMap = RegisteredEntityMap> = (
  ...args: IdArgsVariant<T>
) => string

/**
 * A function that retrieves an entity declaration by its name.
 */
export type GetEntityByName<T extends AnyEntityMap = RegisteredEntityMap> = <
  E extends Extract<keyof T, string> = Extract<keyof T, string>,
>(
  name: E,
) => EntityDecl<E> | undefined

/**
 * A type guard function that checks if a given string is a valid declaration name.
 */
export type DeclarationNameGuard<T extends DefaultTSONDBTypes> = (
  name: string,
) => name is DeclarationName<T>

/**
 * A type guard function that checks if a given string is a valid entity name.
 */
export type EntityNameGuard<T extends AnyEntityMap = RegisteredEntityMap> = (
  name: string,
) => name is Extract<keyof T, string>
