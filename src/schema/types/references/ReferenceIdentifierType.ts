import { GetNestedDeclarations, getNestedDeclarations } from "../../declarations/Declaration.js"
import { EntityDecl } from "../../declarations/EntityDecl.js"
import { Node, NodeKind } from "../../Node.js"
import { TypeParameter } from "../../parameters/TypeParameter.js"
import { Validator } from "../../validation/type.js"
import {
  Object as _Object,
  MemberDecl,
  ObjectType,
  RequiredProperties,
  validateObjectType,
} from "../generic/ObjectType.js"
import { IntegerType } from "../primitives/IntegerType.js"
import { StringType } from "../primitives/StringType.js"
import { BaseType, Type } from "../Type.js"

type TConstraint = Record<string, MemberDecl<Type, boolean>>

export interface ReferenceIdentifierType<T extends TConstraint = TConstraint> extends BaseType {
  kind: typeof NodeKind.ReferenceIdentifierType
  entity: EntityDecl<string, ObjectType<T>, RequiredProperties<T> & string, TypeParameter[]>
}

export const ReferenceIdentifierType = <T extends TConstraint>(
  entity: EntityDecl<string, ObjectType<T>, RequiredProperties<T> & string, TypeParameter[]>,
): ReferenceIdentifierType<T> => ({
  kind: NodeKind.ReferenceIdentifierType,
  entity,
})

export { ReferenceIdentifierType as ReferenceIdentifier }

export const isReferenceIdentifierType = (node: Node): node is ReferenceIdentifierType =>
  node.kind === NodeKind.ReferenceIdentifierType

export const getNestedDeclarationsInReferenceIdentifierType: GetNestedDeclarations<
  ReferenceIdentifierType
> = (isDeclAdded, type) => [type.entity, ...getNestedDeclarations(isDeclAdded, type.entity)]

// export const ENTITY_NAME_KEY = "entityName"
// export const ENTITY_IDENTIFIER_KEY = "entityIdentifier"

export const identifierObjectTypeForEntity = (entity: EntityDecl): ObjectType =>
  _Object(
    Object.fromEntries(
      entity.primaryKey.map(key => [key, entity.type.value.properties[key]!] as const),
    ),
  )

export const validateReferenceIdentifierType: Validator<ReferenceIdentifierType> = (
  helpers,
  type,
  value,
) => {
  // if (typeof value !== "object" || value === null || Array.isArray(value)) {
  //   return [TypeError(`Expected an object, but got ${JSON.stringify(value)}`)]
  // }

  // if (
  //   Object.keys(value).length !== 2 ||
  //   !(ENTITY_NAME_KEY in value) ||
  //   !(ENTITY_IDENTIFIER_KEY in value)
  // ) {
  //   return [
  //     TypeError(
  //       `An identifier object must and must only have the keys "${ENTITY_NAME_KEY}" and "${ENTITY_IDENTIFIER_KEY}".`,
  //     ),
  //   ]
  // }

  // const entityNameErrors = validateStringType(helpers, String(), value[ENTITY_NAME_KEY])

  // if (entityNameErrors.length > 0) {
  //   return entityNameErrors.map(error =>
  //     TypeError(`at object key "${ENTITY_NAME_KEY}"`, { cause: error }),
  //   )
  // }

  const identifierObjectType = identifierObjectTypeForEntity(type.entity)

  return validateObjectType(helpers, identifierObjectType, value).concat(
    helpers.checkReferentialIntegrity({
      name: type.entity.name,
      values: type.entity.primaryKey.map(primaryKey => [
        primaryKey,
        (value as Record<string, unknown>)[primaryKey],
      ]),
    }),
  )
}

export const replaceTypeArgumentsInReferenceIdentifierType = <
  T extends TConstraint,
  Args extends Record<string, Type>,
>(
  _args: Args,
  type: ReferenceIdentifierType<T>,
): ReferenceIdentifierType<T> => type

export type SimpleReferenceMemberDecl<K extends string, T extends Type> = MemberDecl<
  ReferenceIdentifierType<{ [Key in K]: MemberDecl<T, true> }>,
  true
>

export type SimpleIntegerIdentifierReferenceMemberDecl = SimpleReferenceMemberDecl<
  "id",
  IntegerType
>
export type SimpleStringIdentifierReferenceMemberDecl = SimpleReferenceMemberDecl<"id", StringType>
