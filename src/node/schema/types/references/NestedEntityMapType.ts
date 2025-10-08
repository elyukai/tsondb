import { Lazy } from "../../../../shared/utils/lazy.ts"
import { sortObjectKeysAlphabetically } from "../../../../shared/utils/object.ts"
import { parallelizeErrors } from "../../../../shared/utils/validation.ts"
import type { DisplayNameCustomizer } from "../../../utils/displayName.ts"
import { wrapErrorsIfAny } from "../../../utils/error.ts"
import { entity, json, key as keyColor } from "../../../utils/errorFormatting.ts"
import type { EntityDecl } from "../../declarations/EntityDecl.js"
import { type EntityDisplayName } from "../../declarations/EntityDecl.js"
import type { TypeAliasDecl } from "../../declarations/TypeAliasDecl.js"
import type {
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  Serializer,
  TypeArgumentsResolver,
  Validator,
} from "../../Node.ts"
import { getNestedDeclarations, NodeKind, resolveTypeArguments, validateType } from "../../Node.ts"
import type { MemberDecl, ObjectType } from "../generic/ObjectType.ts"
import {
  getReferencesForObjectType,
  isObjectType,
  serializeObjectType,
} from "../generic/ObjectType.ts"
import type { BaseType, StructureFormatter } from "../Type.ts"
import { formatValue } from "../Type.ts"
import {
  formatIncludeIdentifierValue,
  getReferencesForIncludeIdentifierType,
  serializeIncludeIdentifierType,
  type IncludeIdentifier,
} from "./IncludeIdentifierType.ts"

type TConstraint = Record<string, MemberDecl>

type PossibleType<T extends TConstraint> =
  | ObjectType<T>
  | IncludeIdentifier<[], TypeAliasDecl<string, ObjectType<T>, []>>

export interface NestedEntityMapType<
  Name extends string = string,
  T extends TConstraint = TConstraint,
> extends BaseType {
  kind: NodeKind["NestedEntityMapType"]
  name: Name
  namePlural: string
  comment?: string
  secondaryEntity: EntityDecl
  type: Lazy<PossibleType<T>>
}

export const NestedEntityMapType = <Name extends string, T extends TConstraint>(options: {
  name: Name
  namePlural: string
  comment?: string
  secondaryEntity: EntityDecl
  type: PossibleType<T>
  /**
   * @default "name"
   */
  displayName?: EntityDisplayName<T>
  displayNameCustomizer?: DisplayNameCustomizer<ObjectType<T>>
  isDeprecated?: boolean
}): NestedEntityMapType<Name, T> => {
  const nestedEntityMapType: NestedEntityMapType<Name, T> = {
    ...options,
    kind: NodeKind.NestedEntityMapType,
    type: Lazy.of(() => options.type),
  }

  return nestedEntityMapType
}

export { NestedEntityMapType as NestedEntityMap }

const _NestedEntityMapType = <Name extends string, T extends TConstraint>(options: {
  name: Name
  namePlural: string
  comment?: string
  secondaryEntity: EntityDecl
  type: () => PossibleType<T>
  /**
   * @default "name"
   */
  displayName?: EntityDisplayName<T>
  displayNameCustomizer?: DisplayNameCustomizer<ObjectType<T>>
  isDeprecated?: boolean
}): NestedEntityMapType<Name, T> => {
  const nestedEntityMapType: NestedEntityMapType<Name, T> = {
    ...options,
    kind: NodeKind.NestedEntityMapType,
    type: Lazy.of(() => options.type()),
  }

  return nestedEntityMapType
}

export const isNestedEntityMapType: Predicate<NestedEntityMapType> = node =>
  node.kind === NodeKind.NestedEntityMapType

export const getNestedDeclarationsInNestedEntityMapType: GetNestedDeclarations<
  NestedEntityMapType
> = (addedDecls, type, parentDecl) =>
  getNestedDeclarations(
    getNestedDeclarations(addedDecls, type.secondaryEntity, parentDecl),
    type.type.value,
    parentDecl,
  )

export const validateNestedEntityMapType: Validator<NestedEntityMapType> = (
  helpers,
  type,
  value,
) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`expected an object, but got ${json(value, helpers.useStyling)}`)]
  }

  return parallelizeErrors(
    Object.keys(value).map(key =>
      wrapErrorsIfAny(
        `at nested entity map ${entity(`"${type.name}"`, helpers.useStyling)} at key ${keyColor(`"${key}"`, helpers.useStyling)}`,
        validateType(helpers, type.type.value, value[key as keyof typeof value]).concat(
          helpers.checkReferentialIntegrity({
            name: type.secondaryEntity.name,
            value: key,
          }),
        ),
      ),
    ),
  )
}

export const resolveTypeArgumentsInNestedEntityMapType: TypeArgumentsResolver<
  NestedEntityMapType
> = (args, type) =>
  _NestedEntityMapType({
    ...type,
    type: () => resolveTypeArguments(args, type.type.value),
  })

export const serializeNestedEntityMapType: Serializer<NestedEntityMapType> = type => ({
  ...type,
  secondaryEntity: type.secondaryEntity.name,
  type: isObjectType(type.type.value)
    ? serializeObjectType(type.type.value)
    : serializeIncludeIdentifierType(type.type.value),
})

export const getReferencesForNestedEntityMapType: GetReferences<NestedEntityMapType> = (
  type,
  value,
) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? Object.values(value)
        .flatMap(item =>
          isObjectType(type.type.value)
            ? getReferencesForObjectType(type.type.value, item)
            : getReferencesForIncludeIdentifierType(type.type.value, item),
        )
        .concat(Object.keys(value))
    : []

export const formatNestedEntityMapValue: StructureFormatter<NestedEntityMapType> = (type, value) =>
  isObjectType(type.type.value)
    ? typeof value === "object" && value !== null && !Array.isArray(value)
      ? sortObjectKeysAlphabetically(
          Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, formatValue(type.type.value, item)]),
          ),
        )
      : value
    : formatIncludeIdentifierValue(type.type.value, value)
