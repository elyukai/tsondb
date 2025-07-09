import type { GetReferences, Node, Serializer } from "../../Node.js";
import { NodeKind } from "../../Node.js"
import type {
  SerializedTypeParameter,
  TypeParameter} from "../../TypeParameter.js";
import {
  serializeTypeParameter
} from "../../TypeParameter.js"
import type { Validator } from "../../validation/type.js"
import type { BaseType, SerializedBaseType, StructureFormatter, Type } from "../Type.js";
import { removeParentKey } from "../Type.js"

type TConstraint = TypeParameter

export interface TypeArgumentType<T extends TConstraint = TConstraint> extends BaseType {
  kind: NodeKind["TypeArgumentType"]
  argument: T
}

type TSerializedConstraint = SerializedTypeParameter

export interface SerializedTypeArgumentType<T extends TSerializedConstraint = TSerializedConstraint>
  extends SerializedBaseType {
  kind: NodeKind["TypeArgumentType"]
  argument: T
}

export const TypeArgumentType = <T extends TConstraint>(argument: T): TypeArgumentType<T> => ({
  kind: NodeKind.TypeArgumentType,
  argument,
})

export { TypeArgumentType as TypeArgument }

export const isTypeArgumentType = (node: Node): node is TypeArgumentType =>
  node.kind === NodeKind.TypeArgumentType

export const validateTypeArgumentType: Validator<TypeArgumentType> = (_helpers, type, _value) => {
  throw new TypeError(
    `generic argument "${type.argument.name}" has not been replaced with a concrete type`,
  )
}

export const resolveTypeArgumentsInTypeArgumentType = <
  T extends TConstraint,
  Args extends Record<string, Type>,
>(
  args: Args,
  type: TypeArgumentType<T>,
): Args[T["name"]] => args[type.argument.name] as Args[T["name"]]

export const serializeTypeArgumentType: Serializer<
  TypeArgumentType,
  SerializedTypeArgumentType
> = type => ({
  ...removeParentKey(type),
  argument: serializeTypeParameter(type.argument),
})

export const getReferencesForTypeArgumentType: GetReferences<TypeArgumentType> = (
  _type,
  _value,
) => []

export const formatTypeArgumentValue: StructureFormatter<TypeArgumentType> = (_type, value) => value
