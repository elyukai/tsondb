import { NodeKind } from "../../../../shared/schema/Node.ts"
import { type EntityDecl } from "../declarations/EntityDecl.ts"
import type { Node } from "../index.ts"
import type { MemberDecl } from "./ObjectType.ts"
import type { BaseType } from "./Type.ts"

export interface ChildEntitiesType<
  T extends EntityDecl<string, Record<string, MemberDecl>, string> = EntityDecl<
    string,
    Record<string, MemberDecl>,
    string
  >,
> extends BaseType {
  kind: NodeKind["ChildEntitiesType"]
  entity: T
}

export const ChildEntitiesType = <T extends EntityDecl<string, Record<string, MemberDecl>, string>>(
  entity: T,
): ChildEntitiesType<T> => ({
  kind: NodeKind.ChildEntitiesType,
  entity,
})

export { ChildEntitiesType as ChildEntities }

export const isChildEntitiesType = (node: Node): node is ChildEntitiesType =>
  node.kind === NodeKind.ChildEntitiesType
