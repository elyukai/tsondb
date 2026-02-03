import { NodeKind } from "../../../../shared/schema/Node.js"
import type { Node } from "../index.ts"
import type { StringType } from "./StringType.ts"
import type { BaseType } from "./Type.ts"

type TConstraint = { [key: string]: null | TConstraint }

export type { TConstraint as TranslationObjectTypeConstraint }

export interface TranslationObjectType<T extends TConstraint = TConstraint> extends BaseType {
  kind: NodeKind["TranslationObjectType"]
  properties: T
  allKeysAreRequired: boolean
}

export const TranslationObjectType = <T extends TConstraint>(
  properties: T,
  options: {
    allKeysAreRequired?: boolean
  } = {},
): TranslationObjectType<T> => {
  const type: TranslationObjectType<T> = {
    allKeysAreRequired: false,
    ...options,
    kind: NodeKind.TranslationObjectType,
    properties,
  }

  return type
}

export { TranslationObjectType as TranslationObject }

export const isTranslationObjectType = (node: Node): node is TranslationObjectType =>
  node.kind === NodeKind.TranslationObjectType

export const getTypeOfKey = <T extends TConstraint>(
  keyValue: null | T,
  parentType?: TranslationObjectType,
): StringType | TranslationObjectType<T> =>
  keyValue === null
    ? { kind: "StringType" }
    : {
        kind: "TranslationObjectType",
        allKeysAreRequired: false,
        ...parentType,
        properties: keyValue,
      }
