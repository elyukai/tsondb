import { NodeKind } from "../../../../shared/schema/Node.ts"
import type { ObjectConstraints } from "../../../../shared/validation/object.ts"
import { validateOption } from "../../validation/options.ts"
import type { Node } from "../index.ts"
import type { BaseType, Type } from "./Type.ts"

type TConstraint = Record<string, MemberDecl>

export interface ObjectType<T extends TConstraint = TConstraint>
  extends BaseType, ObjectConstraints {
  kind: NodeKind["ObjectType"]
  properties: T
}

const keyPattern = /^[a-zA-Z0-9][a-zA-Z0-9_]*$/

export const ObjectType = <T extends TConstraint>(
  properties: T,
  options: {
    additionalProperties?: boolean
    minProperties?: number
    maxProperties?: number
  } = {},
): ObjectType<T> => {
  const type: ObjectType<T> = {
    ...options,
    kind: NodeKind.ObjectType,
    minProperties: validateOption(
      options.minProperties,
      "minProperties",
      option => Number.isInteger(option) && option >= 0,
    ),
    maxProperties: validateOption(
      options.maxProperties,
      "maxProperties",
      option => Number.isInteger(option) && option >= 0,
    ),
    properties,
  }

  Object.keys(properties).forEach(key => {
    if (!keyPattern.test(key)) {
      throw new TypeError(
        `Invalid object key "${key}". Object keys must not start with an underscore and may only contain letters, digits and underscores. (Pattern: ${keyPattern.source})`,
      )
    }
  })

  return type
}

export { ObjectType as Object }

export const isObjectType = (node: Node): node is ObjectType => node.kind === NodeKind.ObjectType

export interface MemberDecl<T extends Type = Type, R extends boolean = boolean> {
  kind: NodeKind["MemberDecl"]
  isRequired: R
  type: T

  /**
   * Changes the appearance of the member’s name in editor forms.
   */
  displayName?: string
  comment?: string
  isDeprecated?: boolean
}

const MemberDecl = <T extends Type, R extends boolean>(
  isRequired: R,
  options: {
    type: T

    /**
     * Changes the appearance of the member’s name in editor forms.
     */
    displayName?: string
    comment?: string
    isDeprecated?: boolean
  },
): MemberDecl<T, R> => ({
  ...options,
  kind: NodeKind.MemberDecl,
  isRequired,
})

export const Required = <T extends Type>(options: {
  /**
   * Changes the appearance of the member’s name in editor forms.
   */
  displayName?: string
  comment?: string
  isDeprecated?: boolean
  type: T
}) => MemberDecl(true, options)

export const Optional = <T extends Type>(options: {
  /**
   * Changes the appearance of the member’s name in editor forms.
   */
  displayName?: string
  comment?: string
  isDeprecated?: boolean
  type: T
}) => MemberDecl(false, options)
