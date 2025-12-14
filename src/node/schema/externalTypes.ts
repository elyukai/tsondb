import type { InstanceContent } from "../../shared/utils/instances.ts"

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
