import type { DateConstraints } from "../../../../shared/validation/date.ts"
import { validateDateConstraints } from "../../../../shared/validation/date.ts"
import { json } from "../../../utils/errorFormatting.ts"
import type {
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  Serializer,
  TypeArgumentsResolver,
  Validator,
} from "../../Node.ts"
import { NodeKind } from "../../Node.ts"
import type { BaseType, StructureFormatter } from "../Type.ts"

export interface DateType extends BaseType, DateConstraints {
  kind: NodeKind["DateType"]
}

export const DateType = (options?: DateConstraints): DateType => ({
  ...options,
  kind: NodeKind.DateType,
})

export { DateType as Date }

export const isDateType: Predicate<DateType> = node => node.kind === NodeKind.DateType

export const getNestedDeclarationsInDateType: GetNestedDeclarations<DateType> = addedDecls =>
  addedDecls

export const validateDateType: Validator<DateType> = (helpers, _inDecls, type, value) => {
  if (typeof value !== "string") {
    return [TypeError(`expected a string, but got ${json(value, helpers.useStyling)}`)]
  }

  return validateDateConstraints(type, value)
}

export const resolveTypeArgumentsInDateType: TypeArgumentsResolver<DateType> = (_args, type) => type

export const serializeDateType: Serializer<DateType> = type => type

export const getReferencesForDateType: GetReferences<DateType> = () => []

export const formatDateValue: StructureFormatter<DateType> = (_type, value) => value
