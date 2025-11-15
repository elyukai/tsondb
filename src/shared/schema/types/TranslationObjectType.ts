import {
  NodeKind,
  type GetReferencesSerialized,
  type SerializedNode,
  type SerializedTypeArgumentsResolver,
} from "../Node.js"
import type { SerializedStringType } from "./StringType.ts"
import type { SerializedBaseType } from "./Type.ts"

type TSerializedConstraint = { [key: string]: null | TSerializedConstraint }

export interface SerializedTranslationObjectType<
  T extends TSerializedConstraint = TSerializedConstraint,
> extends SerializedBaseType {
  kind: NodeKind["TranslationObjectType"]
  properties: T
  allKeysAreRequired: boolean
}

export const isSerializedTranslationObjectType = (
  node: SerializedNode,
): node is SerializedTranslationObjectType => node.kind === NodeKind.TranslationObjectType

export const resolveTypeArgumentsInSerializedTranslationObjectType: SerializedTypeArgumentsResolver<
  SerializedTranslationObjectType
> = (_decls, _args, type) => type

export const getReferencesForSerializedTranslationObjectType: GetReferencesSerialized<
  SerializedTranslationObjectType
> = () => []

export const getSerializedTypeOfKey = <T extends TSerializedConstraint>(
  keyValue: null | T,
  parentType?: SerializedTranslationObjectType,
): SerializedStringType | SerializedTranslationObjectType<T> =>
  keyValue === null
    ? { kind: "StringType" }
    : {
        kind: "TranslationObjectType",
        allKeysAreRequired: false,
        ...parentType,
        properties: keyValue,
      }
