import {
  getSerializedTypeArgumentsRecord,
  type SerializedDecl,
  type SerializedTypeArguments,
} from "../declarations/Declaration.ts"
import {
  getDecl,
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
) => {
  const reference = getDecl(decls, type.reference)

  return (
    isNoGenericSerializedIncludeIdentifierType(type)
      ? type
      : resolveSerializedTypeArguments(
          decls,
          getSerializedTypeArgumentsRecord(
            reference,
            type.args.map(arg => resolveSerializedTypeArguments(decls, args, arg)),
          ),
          reference,
        ).type
  ) as T extends SerializedIncludeIdentifierType<[]> ? T : SerializedType
}) satisfies SerializedTypeArgumentsResolver<SerializedIncludeIdentifierType>

export const getReferencesForSerializedIncludeIdentifierType: GetReferencesSerialized<
  SerializedIncludeIdentifierType
> = (decls, type, value) => {
  const reference = getDecl(decls, type.reference)

  return getReferencesSerialized(
    decls,
    resolveSerializedTypeArguments(
      decls,
      getSerializedTypeArgumentsRecord(reference, type.args),
      reference,
    ),
    value,
  )
}
