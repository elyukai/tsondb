import { ENUM_DISCRIMINATOR_KEY } from "../../shared/schema/declarations/EnumDecl.ts"
import type { RegisteredChildEntityMap, RegisteredEntityMap } from "./externalTypes.ts"

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
export type IdArgsVariant<U extends keyof RegisteredEntityMap = keyof RegisteredEntityMap> =
  | [entity: U, id: string]
  | [enumCase: Case<U, string>]

export const normalizedIdArgs = <U extends keyof RegisteredEntityMap>(
  args: IdArgsVariant<U>,
): { entityName: U; id: string } => {
  if (typeof args[0] === "object") {
    const [enumCase] = args
    return {
      entityName: enumCase[ENUM_DISCRIMINATOR_KEY],
      id: enumCase[enumCase[ENUM_DISCRIMINATOR_KEY]],
    }
  } else {
    const [entityName, id] = args as [U, string]
    return { entityName, id }
  }
}

export type GetInstanceById = <U extends keyof RegisteredEntityMap>(
  ...args: IdArgsVariant<U>
) => RegisteredEntityMap[U] | undefined

export type GetAllInstances = <U extends keyof RegisteredEntityMap>(
  entity: U,
) => RegisteredEntityMap[U][]

export type GetAllChildInstancesForParent = <U extends keyof RegisteredChildEntityMap>(
  entity: U,
  parentId: RegisteredChildEntityMap[U][2],
) => RegisteredChildEntityMap[U][0][]

/**
 * Displays the name of an entity instance including its ID. If no display name is found, `undefined` is returned.
 */
export type GetDisplayName = (...args: IdArgsVariant) => string | undefined

/**
 * Displays the name of an entity instance including its ID. If no display name is found, only the ID is returned.
 */
export type GetDisplayNameWithId = (...args: IdArgsVariant) => string
