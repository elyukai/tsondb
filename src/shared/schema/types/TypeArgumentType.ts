import type { SerializedDecl } from "../declarations/Declaration.ts"
import type { GetReferencesSerialized, NodeKind, SerializedTypeArgumentsResolver } from "../Node.ts"
import type { SerializedTypeParameter } from "../TypeParameter.ts"
import type { SerializedBaseType, SerializedType } from "./Type.ts"

type TSerializedConstraint = SerializedTypeParameter

export interface SerializedTypeArgumentType<T extends TSerializedConstraint = TSerializedConstraint>
  extends SerializedBaseType {
  kind: NodeKind["TypeArgumentType"]
  argument: T
}

export const resolveTypeArgumentsInSerializedTypeArgumentType = (<
  T extends TSerializedConstraint,
  Args extends Record<string, SerializedType>,
>(
  _decls: Record<string, SerializedDecl>,
  args: Args,
  type: SerializedTypeArgumentType<T>,
): Args[T["name"]] => {
  if (!(type.argument.name in args)) {
    throw new TypeError(`no generic argument provided for "${type.argument.name}"`)
  }

  return args[type.argument.name] as Args[T["name"]]
}) satisfies SerializedTypeArgumentsResolver<SerializedTypeArgumentType>

export const getReferencesForSerializedTypeArgumentType: GetReferencesSerialized<
  SerializedTypeArgumentType
> = (_decls, _type, _value) => []
