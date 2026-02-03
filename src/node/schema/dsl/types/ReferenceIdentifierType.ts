import { NodeKind } from "../../../../shared/schema/Node.ts"
import type { EntityDecl } from "../declarations/EntityDecl.ts"
import type { Node } from "../index.ts"
import type { BaseType } from "./Type.ts"

export interface ReferenceIdentifierType extends BaseType {
  kind: NodeKind["ReferenceIdentifierType"]
  entity: EntityDecl
}

export const ReferenceIdentifierType = (entity: EntityDecl): ReferenceIdentifierType => ({
  kind: NodeKind.ReferenceIdentifierType,
  entity,
})

export { ReferenceIdentifierType as ReferenceIdentifier }

export const isReferenceIdentifierType = (node: Node): node is ReferenceIdentifierType =>
  node.kind === NodeKind.ReferenceIdentifierType
