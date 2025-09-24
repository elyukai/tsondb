import type {
  GetNestedDeclarations,
  GetReferences,
  Node,
  Serializer,
  TypeArgumentsResolver,
  Validator,
} from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import type { TypeParameter } from "../../TypeParameter.ts"
import { serializeTypeParameter } from "../../TypeParameter.ts"
import type { BaseType, StructureFormatter, Type } from "../Type.ts"
import { removeParentKey } from "../Type.ts"

type TConstraint = TypeParameter

export interface TypeArgumentType<T extends TConstraint = TConstraint> extends BaseType {
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

export const getNestedDeclarationsInTypeArgumentType: GetNestedDeclarations<
  TypeArgumentType
> = addedDecls => addedDecls

export const validateTypeArgumentType: Validator<TypeArgumentType> = (_helpers, type) => {
  throw new TypeError(
    `generic argument "${type.argument.name}" has not been replaced with a concrete type`,
  )
}

export const resolveTypeArgumentsInTypeArgumentType = (<
  T extends TConstraint,
  Args extends Record<string, Type>,
>(
  args: Args,
  type: TypeArgumentType<T>,
): Args[T["name"]] => {
  if (!(type.argument.name in args)) {
    throw new TypeError(`no generic argument provided for "${type.argument.name}"`)
  }

  return args[type.argument.name] as Args[T["name"]]
}) satisfies TypeArgumentsResolver<TypeArgumentType>

export const serializeTypeArgumentType: Serializer<TypeArgumentType> = type => ({
  ...removeParentKey(type),
  argument: serializeTypeParameter(type.argument),
})

export const getReferencesForTypeArgumentType: GetReferences<TypeArgumentType> = (
  _type,
  _value,
) => []

export const formatTypeArgumentValue: StructureFormatter<TypeArgumentType> = (_type, value) => value
