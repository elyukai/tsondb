import { GetReferences, Node, NodeKind, Serializer } from "../../Node.js"
import {
  SerializedTypeParameter,
  serializeTypeParameter,
  TypeParameter,
} from "../../parameters/TypeParameter.js"
import { Validator } from "../../validation/type.js"
import { BaseType, removeParentKey, SerializedBaseType, Type } from "../Type.js"

type TConstraint = TypeParameter

export interface GenericArgumentIdentifierType<T extends TConstraint = TConstraint>
  extends BaseType {
  kind: NodeKind["GenericArgumentIdentifierType"]
  argument: T
}

type TSerializedConstraint = SerializedTypeParameter

export interface SerializedGenericArgumentIdentifierType<
  T extends TSerializedConstraint = TSerializedConstraint,
> extends SerializedBaseType {
  kind: NodeKind["GenericArgumentIdentifierType"]
  argument: T
}

export const GenericArgumentIdentifierType = <T extends TConstraint>(
  argument: T,
): GenericArgumentIdentifierType<T> => ({
  kind: NodeKind.GenericArgumentIdentifierType,
  argument,
})

export { GenericArgumentIdentifierType as GenericArgumentIdentifier }

export const isGenericArgumentIdentifierType = (
  node: Node,
): node is GenericArgumentIdentifierType => node.kind === NodeKind.GenericArgumentIdentifierType

export const validateGenericArgumentIdentifierType: Validator<GenericArgumentIdentifierType> = (
  _helpers,
  type,
  _value,
) => {
  throw new TypeError(
    `generic argument "${type.argument.name}" has not been replaced with a concrete type`,
  )
}

export const resolveTypeArgumentsInGenericArgumentIdentifierType = <
  T extends TConstraint,
  Args extends Record<string, Type>,
>(
  args: Args,
  type: GenericArgumentIdentifierType<T>,
): Args[T["name"]] => args[type.argument.name] as Args[T["name"]]

export const serializeGenericArgumentIdentifierType: Serializer<
  GenericArgumentIdentifierType,
  SerializedGenericArgumentIdentifierType
> = type => ({
  ...removeParentKey(type),
  argument: serializeTypeParameter(type.argument),
})

export const getReferencesForGenericArgumentIdentifierType: GetReferences<
  GenericArgumentIdentifierType
> = (_type, _value) => []
