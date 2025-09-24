import type { SerializedDecl, SerializedTypeArguments } from "../declarations/Declaration.ts"
import {
  getReferencesSerialized,
  resolveSerializedTypeArguments,
  type GetReferencesSerialized,
  type NodeKind,
  type SerializedTypeArgumentsResolver,
} from "../Node.ts"
import type { SerializedTypeParameter } from "../TypeParameter.ts"
import type { SerializedBaseType, SerializedType } from "./Type.ts"

export interface SerializedIncludeIdentifierType<
  Params extends SerializedTypeParameter[] = SerializedTypeParameter[],
> extends SerializedBaseType {
  kind: NodeKind["IncludeIdentifierType"]
  reference: string
  args: SerializedTypeArguments<Params>
}

const isNoGenericSerializedIncludeIdentifierType = (
  node: SerializedIncludeIdentifierType,
): node is SerializedIncludeIdentifierType<[]> => node.args.length === 0

export const resolveTypeArgumentsInSerializedIncludeIdentifierType = (<
  T extends SerializedIncludeIdentifierType,
>(
  decls: Record<string, SerializedDecl>,
  args: Record<string, SerializedType>,
  type: T,
) =>
  (isNoGenericSerializedIncludeIdentifierType(type)
    ? type
    : resolveSerializedTypeArguments(
        decls,
        getTypeArgumentsRecord(
          type.reference,
          type.args.map(arg => resolveSerializedTypeArguments(decls, args, arg)),
        ),
        type.reference,
      ).type.value) as T extends SerializedIncludeIdentifierType<[]>
    ? T
    : SerializedType) satisfies SerializedTypeArgumentsResolver<SerializedIncludeIdentifierType>

export const getReferencesForSerializedIncludeIdentifierType: GetReferencesSerialized<
  SerializedIncludeIdentifierType
> = (decls, type, value) =>
  getReferencesSerialized(
    decls,
    resolveSerializedTypeArguments(decls, type.reference, type.args),
    value,
  )
