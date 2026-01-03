import type { NumberConstraints } from "../../../../shared/validation/number.ts"
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
import type { BaseType, StructureFormatter } from "../Type.ts"

export interface FloatConstraints extends NumberConstraints {
  fractionDigits?: number
}

export interface FloatType extends BaseType, FloatConstraints {
  kind: NodeKind["FloatType"]
}

export const FloatType = (options: FloatConstraints = {}): FloatType => {
  if (
    options.fractionDigits !== undefined &&
    (!Number.isInteger(options.fractionDigits) || options.fractionDigits < 1)
  ) {
    throw new TypeError("The fractionDigits option must be a positive integer")
  }

  return {
    ...options,
    kind: NodeKind.FloatType,
  }
}

export { FloatType as Float }

export const isFloatType: Predicate<FloatType> = node => node.kind === NodeKind.FloatType

export const getNestedDeclarationsInFloatType: GetNestedDeclarations<FloatType> = addedDecls =>
  addedDecls

export const validateFloatType: Validator<FloatType> = (helpers, _inDecls, type, value) => {
  if (typeof value !== "number") {
    return [
      TypeError(`expected a floating-point number, but got ${json(value, helpers.useStyling)}`),
    ]
  }

  return validateNumberConstraints(type, value)
}

export const resolveTypeArgumentsInFloatType: TypeArgumentsResolver<FloatType> = (_args, type) =>
  type

export const serializeFloatType: Serializer<FloatType> = type => type

export const getReferencesForFloatType: GetReferences<FloatType> = () => []

export const formatFloatValue: StructureFormatter<FloatType> = (_type, value) => value

export const checkCustomConstraintsInFloatType: CustomConstraintValidator<FloatType> = () => []
