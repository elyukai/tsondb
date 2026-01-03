import type { StringConstraints } from "../../../../shared/validation/string.ts"
import { validateStringConstraints } from "../../../../shared/validation/string.ts"
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

export interface StringType extends BaseType, StringConstraints {
  kind: NodeKind["StringType"]
  pattern?: RegExp
  isMarkdown?: boolean
}
export const StringType = (
  options: {
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    isMarkdown?: boolean
  } = {},
): StringType => ({
  ...options,
  kind: NodeKind.StringType,
})

export { StringType as String }

export const isStringType: Predicate<StringType> = node => node.kind === NodeKind.StringType

export const getNestedDeclarationsInStringType: GetNestedDeclarations<StringType> = addedDecls =>
  addedDecls

export const validateStringType: Validator<StringType> = (helpers, _inDecls, type, value) => {
  if (typeof value !== "string") {
    return [TypeError(`expected a string, but got ${json(value, helpers.useStyling)}`)]
  }

  return validateStringConstraints(type, value)
}

export const resolveTypeArgumentsInStringType: TypeArgumentsResolver<StringType> = (_args, type) =>
  type

export const serializeStringType: Serializer<StringType> = type => ({
  ...type,
  pattern: type.pattern?.source,
})

export const getReferencesForStringType: GetReferences<StringType> = () => []

export const formatStringValue: StructureFormatter<StringType> = (_type, value) => value

export const checkCustomConstraintsInStringType: CustomConstraintValidator<StringType> = () => []
