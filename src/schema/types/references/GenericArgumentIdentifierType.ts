import { TypeParameter } from "../../parameters/TypeParameter.js"
import { NodeKind } from "../Node.js"
import { Type } from "../Type.js"

type TConstraint = TypeParameter

export interface GenericArgumentIdentifierType<T extends TConstraint> {
  kind: typeof NodeKind.GenericArgumentIdentifierType
  argument: T
}

export const GenericArgumentIdentifier = <T extends TConstraint>(
  argument: T,
): GenericArgumentIdentifierType<T> => ({
  kind: NodeKind.GenericArgumentIdentifierType,
  argument,
})

export const isGenericArgumentIdentifierType = (
  type: Type,
): type is GenericArgumentIdentifierType<TConstraint> =>
  type.kind === NodeKind.GenericArgumentIdentifierType

export const validateGenericArgumentIdentifierType = (
  _type: GenericArgumentIdentifierType<TConstraint>,
  _value: unknown,
): void => {}

export const replaceTypeArgumentsInGenericArgumentIdentifierType = <
  T extends TConstraint,
  Args extends Record<string, Type>,
>(
  args: Args,
  type: GenericArgumentIdentifierType<T>,
): Args[T["name"]] => args[type.argument.name] as Args[T["name"]]
