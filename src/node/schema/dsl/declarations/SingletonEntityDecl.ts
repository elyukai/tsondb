import { Lazy } from "@elyukai/utils/lazy"
import { NodeKind } from "../../../../shared/schema/Node.ts"
import type { SortOrder } from "../../../../shared/schema/utils/sortOrder.ts"
import type { CustomConstraint, TypedCustomConstraint } from "../../../utils/customConstraints.ts"
import type { Node } from "../index.ts"
import type { MemberDecl, ObjectType } from "../types/ObjectType.ts"
import { type BaseDecl, validateDeclName } from "./Decl.ts"

type TConstraint = Record<string, MemberDecl>

export interface SingletonEntityDecl<
  Name extends string = string,
  T extends TConstraint = TConstraint,
> extends BaseDecl<Name, []> {
  kind: NodeKind["SingletonEntityDecl"]

  /**
   * Changes the appearance of the entity’s name in singular form.
   */
  displayName?: string
  type: Lazy<ObjectType<T>>
  isDeprecated?: boolean
  customConstraints?: CustomConstraint

  /**
   * The order in which instances of an entity are sorted in the editor. This affects entity details pages and reference options.
   */
  sortOrder?: SortOrder
}

export const SingletonEntityDecl = <Name extends string, T extends TConstraint>(
  sourceUrl: string,
  options: {
    name: Name

    /**
     * Changes the appearance of the entity’s name in singular form.
     */
    displayName?: string
    comment?: string
    type: () => ObjectType<T>
    isDeprecated?: boolean
    customConstraints?: TypedCustomConstraint<Name>
  },
): SingletonEntityDecl<Name, T> => {
  validateDeclName(options.name)

  return {
    ...options,
    kind: NodeKind.SingletonEntityDecl,
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

export { SingletonEntityDecl as SingletonEntity }

export const isSingletonEntityDecl = (node: Node): node is SingletonEntityDecl =>
  node.kind === NodeKind.SingletonEntityDecl
