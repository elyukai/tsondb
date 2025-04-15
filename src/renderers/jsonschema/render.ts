import { Decl } from "../../schema/declarations/Declaration.js"
import { EntityDecl, isEntityDecl } from "../../schema/declarations/EntityDecl.js"
import { EnumDecl } from "../../schema/declarations/EnumDecl.js"
import { TypeAliasDecl } from "../../schema/declarations/TypeAliasDecl.js"
import { flatMapAuxiliaryDecls, NodeKind } from "../../schema/Node.js"
import { TypeParameter } from "../../schema/parameters/TypeParameter.js"
import { ArrayType } from "../../schema/types/generic/ArrayType.js"
import { MemberDecl, ObjectType } from "../../schema/types/generic/ObjectType.js"
import { BooleanType } from "../../schema/types/primitives/BooleanType.js"
import { DateType } from "../../schema/types/primitives/DateType.js"
import { FloatType, IntegerType, RangeBound } from "../../schema/types/primitives/NumericType.js"
import { StringType } from "../../schema/types/primitives/StringType.js"
import { GenericArgumentIdentifierType } from "../../schema/types/references/GenericArgumentIdentifierType.js"
import { IncludeIdentifierType } from "../../schema/types/references/IncludeIdentifierType.js"
import {
  isNestedEntityMapType,
  NestedEntityMapType,
} from "../../schema/types/references/NestedEntityMapType.js"
import {
  identifierObjectTypeForEntity,
  ReferenceIdentifierType,
} from "../../schema/types/references/ReferenceIdentifierType.js"
import { getParentDecl, Type } from "../../schema/types/Type.js"
import { assertExhaustive } from "../../utils/typeSafety.js"

export type JsonSchemaRendererOptions = {
  indentation: number
}

const defaultOptions: JsonSchemaRendererOptions = {
  indentation: 2,
}

type RenderFn<T> = (options: JsonSchemaRendererOptions, node: T) => object

const renderArrayType: RenderFn<ArrayType> = (options, type) => ({
  type: "array",
  items: renderType(options, type.items),
  minItems: type.minItems,
  maxItems: type.maxItems,
  uniqueItems: type.uniqueItems,
})

const renderObjectType: RenderFn<ObjectType<Record<string, MemberDecl<Type, boolean>>>> = (
  options,
  type,
) => ({
  type: "object",
  properties: Object.fromEntries(
    Object.entries(type.properties).map(([name, config]) => [
      name,
      { description: config.comment, ...renderType(options, config.type) },
    ]),
  ),
  required: Object.entries(type.properties)
    .filter(([, config]) => config.isRequired)
    .map(([name]) => name),
  minProperties: type.minProperties,
  maxProperties: type.maxProperties,
  additionalProperties: type.additionalProperties,
})

const renderBooleanType: RenderFn<BooleanType> = (_options, _type) => ({ type: "boolean" })

const renderDateType: RenderFn<DateType> = (_options, _type) => ({
  type: "string",
  format: "date",
})

const renderNumericRangeBounds = (
  inclusiveKey: string,
  exclusiveKey: string,
  rangeBound: RangeBound | undefined,
) =>
  rangeBound === undefined
    ? undefined
    : typeof rangeBound === "number"
    ? { [inclusiveKey]: rangeBound }
    : rangeBound.isExclusive
    ? { [exclusiveKey]: rangeBound.value }
    : { [inclusiveKey]: rangeBound.value }

const renderMultipleOf = (multipleOf: number | undefined) =>
  multipleOf === undefined ? undefined : { multipleOf }

const renderFloatType: RenderFn<FloatType> = (_options, type) => ({
  type: "number",
  ...renderNumericRangeBounds("minimum", "exclusiveMinimum", type.minimum),
  ...renderNumericRangeBounds("maximum", "exclusiveMaximum", type.maximum),
  ...renderMultipleOf(type.multipleOf),
})

const renderIntegerType: RenderFn<IntegerType> = (_options, type) => ({
  type: "integer",
  ...renderNumericRangeBounds("minimum", "exclusiveMinimum", type.minimum),
  ...renderNumericRangeBounds("maximum", "exclusiveMaximum", type.maximum),
  ...renderMultipleOf(type.multipleOf),
})

const renderStringType: RenderFn<StringType> = (_options, type) => ({
  type: "string",
  minLength: type.minLength,
  maxLength: type.maxLength,
  pattern: type.pattern?.source,
})

const renderGenericArgumentIdentifierType: RenderFn<
  GenericArgumentIdentifierType<TypeParameter>
> = (_options, _type) => {
  throw new TypeError("GenericArgumentIdentifierType is not supported in JSON Schema.")
}

const renderReferenceIdentifierType: RenderFn<ReferenceIdentifierType> = (_options, type) => ({
  $ref: `#/$defs/${type.entity.name}_ID`,
})

const renderIncludeIdentifierType: RenderFn<IncludeIdentifierType> = (_options, type) => ({
  $ref: `#/$defs/${type.reference.name}`,
})

const renderNestedEntityMapType: RenderFn<NestedEntityMapType> = (_options, type) => ({
  type: "object",
  additionalProperties: {
    $ref: `#/$defs/${type.name}`,
  },
})

const renderType: RenderFn<Type> = (options, type) => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return renderArrayType(options, type)
    case NodeKind.ObjectType:
      return renderObjectType(options, type)
    case NodeKind.BooleanType:
      return renderBooleanType(options, type)
    case NodeKind.DateType:
      return renderDateType(options, type)
    case NodeKind.FloatType:
      return renderFloatType(options, type)
    case NodeKind.IntegerType:
      return renderIntegerType(options, type)
    case NodeKind.StringType:
      return renderStringType(options, type)
    case NodeKind.GenericArgumentIdentifierType:
      return renderGenericArgumentIdentifierType(options, type)
    case NodeKind.ReferenceIdentifierType:
      return renderReferenceIdentifierType(options, type)
    case NodeKind.IncludeIdentifierType:
      return renderIncludeIdentifierType(options, type)
    case NodeKind.NestedEntityMapType:
      return renderNestedEntityMapType(options, type)
    default:
      return assertExhaustive(type, "Unknown type")
  }
}

const renderEntityDecl: RenderFn<EntityDecl> = (options, decl) => ({
  description: decl.comment,
  ...renderType(options, decl.type.value),
})

const renderEnumDecl: RenderFn<EnumDecl> = (options, decl) => ({
  description: decl.comment,
  oneOf: Object.entries(decl.values.value).map(([caseName, caseDef]) => ({
    type: "object",
    properties: {
      kind: {
        const: caseName,
      },
      ...(caseDef === null ? {} : { [caseName]: renderType(options, caseDef) }),
    },
    required: ["kind", ...(caseDef === null ? [] : [caseName])],
  })),
})

const renderTypeAliasDecl: RenderFn<TypeAliasDecl<string, Type, TypeParameter[]>> = (
  options,
  decl,
) => ({
  description: decl.comment,
  ...renderType(options, decl.type.value),
})

const renderDecl: RenderFn<Decl> = (options, decl) => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return renderEntityDecl(options, decl)
    case NodeKind.EnumDecl:
      return renderEnumDecl(options, decl)
    case NodeKind.TypeAliasDecl:
      return renderTypeAliasDecl(options, decl)
    default:
      return assertExhaustive(decl, "Unknown declaration")
  }
}

const renderDeclarations: RenderFn<Decl[]> = (options, declarations) =>
  Object.fromEntries(declarations.map(decl => [decl.name, renderDecl(options, decl)]))

export const render = (
  options: Partial<JsonSchemaRendererOptions> = defaultOptions,
  declarations: readonly Decl[],
): string => {
  const finalOptions = { ...defaultOptions, ...options }
  return JSON.stringify(
    {
      $defs: renderDeclarations(
        finalOptions,
        flatMapAuxiliaryDecls(node => {
          if (isNestedEntityMapType(node)) {
            return TypeAliasDecl(getParentDecl(node)?.sourceUrl ?? "", {
              name: node.name,
              comment: node.comment,
              type: () => node.type.value,
            })
          } else if (isEntityDecl(node)) {
            return TypeAliasDecl(node.sourceUrl, {
              name: node.name + "_ID",
              type: () => identifierObjectTypeForEntity(node),
            })
          }

          return undefined
        }, declarations),
      ),
    },
    undefined,
    finalOptions.indentation,
  )
}
