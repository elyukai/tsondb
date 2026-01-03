import { json } from "../../../utils/errorFormatting.ts"
import type { GetNestedDeclarations, TypeArgumentsResolver } from "../../index.ts"
import type {
  CustomConstraintValidator,
  GetReferences,
  Predicate,
  Serializer,
  Validator,
} from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import type { BaseType, StructureFormatter } from "../Type.ts"

export interface BooleanType extends BaseType {
  kind: NodeKind["BooleanType"]
}

export const BooleanType = (): BooleanType => ({
  kind: NodeKind.BooleanType,
})

export { BooleanType as Boolean }

export const isBooleanType: Predicate<BooleanType> = node => node.kind === NodeKind.BooleanType

export const getNestedDeclarationsInBooleanType: GetNestedDeclarations<BooleanType> = addedDecls =>
  addedDecls

export const validateBooleanType: Validator<BooleanType> = (helpers, _inDecls, _type, value) => {
  if (typeof value !== "boolean") {
    return [TypeError(`expected a boolean value, but got ${json(value, helpers.useStyling)}`)]
  }

  return []
}

export const resolveTypeArgumentsInBooleanType: TypeArgumentsResolver<BooleanType> = (
  _args,
  type,
) => type

export const serializeBooleanType: Serializer<BooleanType> = type => type

export const getReferencesForBooleanType: GetReferences<BooleanType> = () => []

export const formatBooleanValue: StructureFormatter<BooleanType> = (_type, value) => value

export const checkCustomConstraintsInBooleanType: CustomConstraintValidator<BooleanType> = () => []
