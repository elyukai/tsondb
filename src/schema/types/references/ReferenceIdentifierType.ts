import { Decl, getNestedDeclarations } from "../../declarations/Declaration.js"
import { EntityDecl } from "../../declarations/EntityDecl.js"
import { Node, NodeKind, Validators } from "../../Node.js"
import { TypeParameter } from "../../parameters/TypeParameter.js"
import {
  Object as _Object,
  MemberDecl,
  ObjectType,
  RequiredProperties,
  validateObjectType,
} from "../generic/ObjectType.js"
import { IntegerType } from "../primitives/IntegerType.js"
import { String, StringType, validateStringType } from "../primitives/StringType.js"
import { BaseType, Type } from "../Type.js"

type TConstraint = Record<string, MemberDecl<Type, true>>

export interface ReferenceIdentifierType<T extends TConstraint = TConstraint> extends BaseType {
  kind: typeof NodeKind.ReferenceIdentifierType
  entity: EntityDecl<string, ObjectType<T>, RequiredProperties<T> & string, TypeParameter[]>
}

export const ReferenceIdentifier = <T extends TConstraint>(
  entity: EntityDecl<string, ObjectType<T>, RequiredProperties<T> & string, TypeParameter[]>,
): ReferenceIdentifierType<T> => ({
  kind: NodeKind.ReferenceIdentifierType,
  entity,
})

export const isReferenceIdentifierType = (node: Node): node is ReferenceIdentifierType =>
  node.kind === NodeKind.ReferenceIdentifierType

export const getNestedDeclarationsInReferenceIdentifierType = (
  type: ReferenceIdentifierType,
): Decl[] => [type.entity, ...getNestedDeclarations(type.entity)]

export const ENTITY_NAME_KEY = "entityName"
export const ENTITY_IDENTIFIER_KEY = "entityIdentifier"

export const identifierObjectTypeForEntity = (entity: EntityDecl): ObjectType =>
  _Object(
    Object.fromEntries(
      entity.primaryKey.map(key => [key, entity.type.value.properties[key]!] as const),
    ),
  )

export const validateReferenceIdentifierType = (
  validators: Validators,
  type: ReferenceIdentifierType,
  value: unknown,
): void => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`Expected an object, but got ${JSON.stringify(value)}`)
  }

  if (
    Object.keys(value).length !== 2 ||
    !(ENTITY_NAME_KEY in value) ||
    !(ENTITY_IDENTIFIER_KEY in value)
  ) {
    throw new TypeError(
      `An identifier object must and must only have the keys "${ENTITY_NAME_KEY}" and "${ENTITY_IDENTIFIER_KEY}".`,
    )
  }

  try {
    validateStringType(String(), value[ENTITY_NAME_KEY])
  } catch (error) {
    throw new TypeError(`at object key "${ENTITY_IDENTIFIER_KEY}"`, { cause: error })
  }

  const identifierObjectType = identifierObjectTypeForEntity(type.entity)
  const identifierObject = value[ENTITY_IDENTIFIER_KEY]

  try {
    validateObjectType(validators, identifierObjectType, identifierObject)
  } catch (error) {
    throw new TypeError(`at object key "${ENTITY_IDENTIFIER_KEY}"`, { cause: error })
  }

  validators.checkReferentialIntegrity({
    name: value[ENTITY_NAME_KEY] as string,
    values: type.entity.primaryKey.map(primaryKey => [
      primaryKey,
      (identifierObject as Record<string, unknown>)[primaryKey],
    ]),
  })
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
