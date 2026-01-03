import type { NumberConstraints, RangeBound } from "../../../../shared/validation/number.ts"
import { validateNumberConstraints } from "../../../../shared/validation/number.ts"
import { json } from "../../../utils/errorFormatting.ts"
import type {
  CustomConstraintValidator,
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  Serializer,
  TypeArgumentsResolver,
  Validator,
} from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import { validateOption } from "../../validation/options.ts"
import type { BaseType, StructureFormatter } from "../Type.ts"

export interface IntegerType extends BaseType, NumberConstraints {
  kind: NodeKind["IntegerType"]
}

const isIntegerRangeBoundOption = (option: RangeBound) =>
  Number.isInteger(typeof option === "number" ? option : option.value)

export const IntegerType = (options: NumberConstraints = {}): IntegerType => ({
  kind: NodeKind.IntegerType,
  minimum: validateOption(options.minimum, "minimum", isIntegerRangeBoundOption),
  maximum: validateOption(options.maximum, "maximum", isIntegerRangeBoundOption),
  multipleOf: options.multipleOf,
})

export { IntegerType as Integer }

export const isIntegerType: Predicate<IntegerType> = node => node.kind === NodeKind.IntegerType

export const getNestedDeclarationsInIntegerType: GetNestedDeclarations<IntegerType> = addedDecls =>
  addedDecls

export const validateIntegerType: Validator<IntegerType> = (helpers, _inDecls, type, value) => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return [TypeError(`expected an integer, but got ${json(value, helpers.useStyling)}`)]
  }

  return validateNumberConstraints(type, value)
}

export const resolveTypeArgumentsInIntegerType: TypeArgumentsResolver<IntegerType> = (
  _args,
  type,
) => type

export const serializeIntegerType: Serializer<IntegerType> = type => type

export const getReferencesForIntegerType: GetReferences<IntegerType> = () => []

export const formatIntegerValue: StructureFormatter<IntegerType> = (_type, value) => value

export const checkCustomConstraintsInIntegerType: CustomConstraintValidator<IntegerType> = () => []
