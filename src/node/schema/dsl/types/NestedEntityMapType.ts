import { Lazy } from "@elyukai/utils/lazy"
import { NodeKind } from "../../../../shared/schema/Node.js"
import type { EntityDecl } from "../declarations/EntityDecl.ts"
import type { TypeAliasDecl } from "../declarations/TypeAliasDecl.ts"
import type { Node } from "../index.ts"
import type { TypeParameter } from "../TypeParameter.ts"
import { type IncludeIdentifier } from "./IncludeIdentifierType.ts"
import type { MemberDecl, ObjectType } from "./ObjectType.ts"
import type { BaseType } from "./Type.ts"

type TConstraint = Record<string, MemberDecl>

export type PossibleNestedType<T extends TConstraint> =
  | ObjectType<T>
  | IncludeIdentifier<
      TypeParameter[],
      TypeAliasDecl<string, PossibleNestedType<T>, TypeParameter[]>
    >

export type PossibleType<T extends TConstraint> =
  | ObjectType<T>
  | IncludeIdentifier<[], TypeAliasDecl<string, PossibleNestedType<T>, []>>

export interface NestedEntityMapType<
  Name extends string = string,
  T extends TConstraint = TConstraint,
> extends BaseType {
  kind: NodeKind["NestedEntityMapType"]
  name: Name
  namePlural: string
  comment?: string
  secondaryEntity: EntityDecl
  type: Lazy<PossibleType<T>>
}

export const NestedEntityMapType = <Name extends string, T extends TConstraint>(options: {
  name: Name
  namePlural: string
  comment?: string
  secondaryEntity: EntityDecl
  type: PossibleType<T>
  isDeprecated?: boolean
}): NestedEntityMapType<Name, T> => {
  const nestedEntityMapType: NestedEntityMapType<Name, T> = {
    ...options,
    kind: NodeKind.NestedEntityMapType,
    type: Lazy.of(() => options.type),
  }

  return nestedEntityMapType
}

export { NestedEntityMapType as NestedEntityMap }

export const _NestedEntityMapType = <Name extends string, T extends TConstraint>(options: {
  name: Name
  namePlural: string
  comment?: string
  secondaryEntity: EntityDecl
  type: () => PossibleType<T>
  isDeprecated?: boolean
}): NestedEntityMapType<Name, T> => {
  const nestedEntityMapType: NestedEntityMapType<Name, T> = {
    ...options,
    kind: NodeKind.NestedEntityMapType,
    type: Lazy.of(() => options.type()),
  }

  return nestedEntityMapType
}

export const isNestedEntityMapType = (node: Node): node is NestedEntityMapType =>
  node.kind === NodeKind.NestedEntityMapType
