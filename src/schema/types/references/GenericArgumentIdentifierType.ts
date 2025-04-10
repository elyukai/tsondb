import { Node, NodeKind } from "../../Node.js"
import { TypeParameter } from "../../parameters/TypeParameter.js"
import { Validator } from "../../validation/type.js"
import { BaseType, Type } from "../Type.js"

type TConstraint = TypeParameter

export interface GenericArgumentIdentifierType<T extends TConstraint = TConstraint>
  extends BaseType {
  kind: typeof NodeKind.GenericArgumentIdentifierType
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

export const replaceTypeArgumentsInGenericArgumentIdentifierType = <
  T extends TConstraint,
  Args extends Record<string, Type>,
>(
  args: Args,
  type: GenericArgumentIdentifierType<T>,
): Args[T["name"]] => args[type.argument.name] as Args[T["name"]]
