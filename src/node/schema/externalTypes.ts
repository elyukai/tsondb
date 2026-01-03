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
