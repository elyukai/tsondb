import { Lazy } from "../../../utils/lazy.js"
import { Decl } from "../../declarations/Declaration.js"
import { EntityDecl, isEntityDecl } from "../../declarations/EntityDecl.js"
import { identifierForSinglePrimaryKeyEntity, Node, NodeKind } from "../../Node.js"
import { TypeParameter } from "../../parameters/TypeParameter.js"
import { Validator } from "../../validation/type.js"
import {
  getNestedDeclarationsInObjectType,
  MemberDecl,
  ObjectType,
  replaceTypeArgumentsInObjectType,
  Required,
  validateObjectType,
} from "../generic/ObjectType.js"
import { isStringType, StringType } from "../primitives/StringType.js"
import { BaseType, getParentDecl, Type } from "../Type.js"
import { ReferenceIdentifierType } from "./ReferenceIdentifierType.js"

type TConstraint = Record<string, MemberDecl<Type, boolean>>

type KeyingEntity = EntityDecl<
  string,
  ObjectType<{ id: MemberDecl<StringType, true> }>,
  "id",
  TypeParameter[]
>

export interface NestedEntityMapType<
  Name extends string = string,
  T extends TConstraint = TConstraint,
> extends BaseType {
  kind: typeof NodeKind.NestedEntityMapType
  name: Name
  comment?: string
  secondaryEntity: KeyingEntity
  type: Lazy<ObjectType<T>>
  primaryEntityReferenceIdentifierKey?: keyof T & string
  secondaryEntityReferenceIdentifierKey?: keyof T & string
}

export const NestedEntityMapType = <Name extends string, T extends TConstraint>(options: {
  name: Name
  comment?: string
  secondaryEntity: KeyingEntity
  type: (
    primaryId: MemberDecl<ReferenceIdentifierType, true>,
    secondaryId: MemberDecl<ReferenceIdentifierType<{ id: MemberDecl<StringType, true> }>, true>,
  ) => ObjectType<T>
}): NestedEntityMapType<Name, T> => {
  const nestedEntityMapType: NestedEntityMapType<Name, T> = {
    kind: NodeKind.NestedEntityMapType,
    ...options,
    type: Lazy.of(() => {
      const parentDecl = getParentDecl(nestedEntityMapType)

      if (!parentDecl) {
        throw new Error("Parent declaration not found")
      }

      if (!isEntityDecl(parentDecl)) {
        throw new Error("Parent declaration is not an entity declaration")
      }

      if (
        options.secondaryEntity.primaryKey.length !== 1 ||
        !isStringType(
          options.secondaryEntity.type.value.properties[options.secondaryEntity.primaryKey[0]!]
            .type,
        )
      ) {
        throw new Error("Secondary entity must have a single primary key of type string")
      }

      const primaryReferenceMember = Required({ type: ReferenceIdentifierType(parentDecl) })
      const secondaryReferenceMember = Required({
        type: ReferenceIdentifierType(options.secondaryEntity),
      })

      const referenceMembers = [primaryReferenceMember, secondaryReferenceMember] as const

      const type = options.type(...referenceMembers)

      const referenceMembersKeys = referenceMembers.map(
        member =>
          Object.entries(type.properties).find(([, value]) => value === member)?.[0] as
            | (keyof T & string)
            | undefined,
      )

      if (!referenceMembersKeys.every(key => key !== undefined)) {
        throw new Error(
          "Type must include reference identifier types to both entities as direct properties",
        )
      }

      nestedEntityMapType.primaryEntityReferenceIdentifierKey = referenceMembersKeys[0]
      nestedEntityMapType.secondaryEntityReferenceIdentifierKey = referenceMembersKeys[1]
      type.parent = nestedEntityMapType
      return type
    }),
  }

  return nestedEntityMapType
}

export { NestedEntityMapType as NestedEntityMap }

export const isNestedEntityMapType = (node: Node): node is NestedEntityMapType =>
  node.kind === NodeKind.NestedEntityMapType

export const getNestedDeclarationsInNestedEntityMapType = (type: NestedEntityMapType): Decl[] => [
  type.secondaryEntity,
  ...getNestedDeclarationsInObjectType(type.type.value, [
    type.primaryEntityReferenceIdentifierKey!,
    type.secondaryEntityReferenceIdentifierKey!,
  ]),
]

export const validateNestedEntityMapType: Validator<NestedEntityMapType> = (
  helpers,
  type,
  value,
) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`Expected an object, but got ${JSON.stringify(value)}`)]
  }

  return Object.keys(value).flatMap(key =>
    validateObjectType(helpers, type.type.value, value[key as keyof typeof value])
      .concat(
        helpers.checkReferentialIntegrity(
          identifierForSinglePrimaryKeyEntity(type.secondaryEntity, key),
        ),
      )
      .map(err => TypeError(`at nested entity map "${type.name}" at key "${key}"`, { cause: err })),
  )
}

export const replaceTypeArgumentsInNestedEntityMapType = (
  args: Record<string, Type>,
  type: NestedEntityMapType,
): NestedEntityMapType =>
  NestedEntityMapType({
    ...type,
    type: () => replaceTypeArgumentsInObjectType(args, type.type.value),
  })
