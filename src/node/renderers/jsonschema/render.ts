import { dirname, relative } from "node:path"
import { discriminatorKey } from "../../../shared/enum.ts"
import { assertExhaustive } from "../../../shared/utils/typeSafety.ts"
import type { RangeBound } from "../../../shared/validation/number.ts"
import type { Decl } from "../../schema/declarations/Declaration.ts"
import type { EntityDecl } from "../../schema/declarations/EntityDecl.ts"
import {
  addEphemeralUUIDToType,
  createEntityIdentifierTypeAsDecl,
  isEntityDecl,
} from "../../schema/declarations/EntityDecl.ts"
import type { EnumDecl } from "../../schema/declarations/EnumDecl.ts"
import { TypeAliasDecl } from "../../schema/declarations/TypeAliasDecl.ts"
import { flatMapAuxiliaryDecls, NodeKind } from "../../schema/Node.ts"
import { ArrayType } from "../../schema/types/generic/ArrayType.ts"
import type { EnumType } from "../../schema/types/generic/EnumType.ts"
import type { MemberDecl, ObjectType } from "../../schema/types/generic/ObjectType.ts"
import type { BooleanType } from "../../schema/types/primitives/BooleanType.ts"
import type { DateType } from "../../schema/types/primitives/DateType.ts"
import type { FloatType, IntegerType } from "../../schema/types/primitives/NumericType.ts"
import type { StringType } from "../../schema/types/primitives/StringType.ts"
import type { ChildEntitiesType } from "../../schema/types/references/ChildEntitiesType.ts"
import type { IncludeIdentifierType } from "../../schema/types/references/IncludeIdentifierType.ts"
import type { NestedEntityMapType } from "../../schema/types/references/NestedEntityMapType.ts"
import { isNestedEntityMapType } from "../../schema/types/references/NestedEntityMapType.ts"
import { ReferenceIdentifierType } from "../../schema/types/references/ReferenceIdentifierType.ts"
import type { TypeArgumentType } from "../../schema/types/references/TypeArgumentType.ts"
import type { Type } from "../../schema/types/Type.ts"
import { getParentDecl } from "../../schema/types/Type.ts"
import { ensureSpecialDirStart } from "../../utils/path.ts"

export type JsonSchemaRendererOptions = {
  format: "minified" | "tabs" | { kind: "spaces"; indentation?: number }
  preserveFiles: boolean
}

const defaultIndentation = 2

const defaultOptions: JsonSchemaRendererOptions = {
  format: { kind: "spaces" },
  preserveFiles: false,
}

type RenderFn<T> = (options: JsonSchemaRendererOptions, node: T) => object

const renderArrayType: RenderFn<ArrayType> = (options, type) => ({
  type: "array",
  items: renderType(options, type.items),
  minItems: type.minItems,
  maxItems: type.maxItems,
  uniqueItems: type.uniqueItems,
})

const renderObjectType: RenderFn<ObjectType<Record<string, MemberDecl>>> = (options, type) => ({
  type: "object",
  properties: Object.fromEntries(
    Object.entries(type.properties).map(([name, config]) => [
      name,
      {
        description: config.comment,
        deprecated: config.isDeprecated,
        ...renderType(options, config.type),
      },
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

const renderTypeArgumentType: RenderFn<TypeArgumentType> = (_options, _type) => {
  throw new TypeError("TypeArgumentType is not supported in JSON Schema.")
}

const renderReferenceIdentifierType: RenderFn<ReferenceIdentifierType> = (_options, type) => ({
  $ref: `#/$defs/${type.entity.name}_ID`,
})

const renderIncludeIdentifierType: RenderFn<IncludeIdentifierType> = (options, type) => {
  const sourceUrl = getParentDecl(type)?.sourceUrl ?? ""
  const filePath =
    options.preserveFiles && sourceUrl !== type.reference.sourceUrl
      ? ensureSpecialDirStart(relative(dirname(sourceUrl), type.reference.sourceUrl))
      : ""
  return {
    $ref: `${filePath}#/$defs/${type.reference.name}`,
  }
}

const renderNestedEntityMapType: RenderFn<NestedEntityMapType> = (_options, type) => ({
  type: "object",
  additionalProperties: {
    $ref: `#/$defs/${type.name}`,
  },
})

const renderEnumType: RenderFn<EnumType> = (options, type) => ({
  oneOf: Object.entries(type.values).map(([caseName, caseDef]) => ({
    type: "object",
    deprecated: caseDef.isDeprecated,
    properties: {
      [discriminatorKey]: {
        const: caseName,
      },
      ...(caseDef.type === null ? {} : { [caseName]: renderType(options, caseDef.type) }),
    },
    required: [discriminatorKey, ...(caseDef.type === null ? [] : [caseName])],
  })),
})

const renderChildEntitiesType: RenderFn<ChildEntitiesType> = (options, type) =>
  renderType(options, ArrayType(ReferenceIdentifierType(type.entity), { uniqueItems: true }))

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
    case NodeKind.TypeArgumentType:
      return renderTypeArgumentType(options, type)
    case NodeKind.ReferenceIdentifierType:
      return renderReferenceIdentifierType(options, type)
    case NodeKind.IncludeIdentifierType:
      return renderIncludeIdentifierType(options, type)
    case NodeKind.NestedEntityMapType:
      return renderNestedEntityMapType(options, type)
    case NodeKind.EnumType:
      return renderEnumType(options, type)
    case NodeKind.ChildEntitiesType:
      return renderChildEntitiesType(options, type)
    default:
      return assertExhaustive(type, "Unknown type")
  }
}

const renderEntityDecl: RenderFn<EntityDecl> = (options, decl) => ({
  description: decl.comment,
  deprecated: decl.isDeprecated,
  ...renderType(options, addEphemeralUUIDToType(decl)),
})

const renderEnumDecl: RenderFn<EnumDecl> = (options, decl) => ({
  description: decl.comment,
  deprecated: decl.isDeprecated,
  ...renderEnumType(options, decl.type.value),
})

const renderTypeAliasDecl: RenderFn<TypeAliasDecl> = (options, decl) => ({
  description: decl.comment,
  deprecated: decl.isDeprecated,
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
        flatMapAuxiliaryDecls((node, existingDecls) => {
          if (isNestedEntityMapType(node)) {
            if (existingDecls.some(decl => decl.name === node.name)) {
              // this may happen when a nested entity map is defined in a generic declaration and the generic declaration is used multiple times
              // TODO: circumvent by defining the nested entity declaration outside the generic declaration
              return undefined
            }
            return TypeAliasDecl(getParentDecl(node)?.sourceUrl ?? "", {
              name: node.name,
              comment: node.comment,
              type: () => node.type.value,
            })
          } else if (isEntityDecl(node)) {
            return createEntityIdentifierTypeAsDecl(node)
          }

          return undefined
        }, declarations),
      ),
    },
    undefined,
    finalOptions.format === "minified"
      ? undefined
      : finalOptions.format === "tabs"
        ? "\t"
        : (finalOptions.format.indentation ?? defaultIndentation),
  )
}
