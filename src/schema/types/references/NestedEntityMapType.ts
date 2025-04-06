import { Lazy } from "../../../utils/lazy.js"
import { Decl } from "../../declarations/Declaration.js"
import { EntityDecl, isEntityDecl } from "../../declarations/EntityDecl.js"
import { identifierForSinglePrimaryKeyEntity, Node, NodeKind, Validators } from "../../Node.js"
import { TypeParameter } from "../../parameters/TypeParameter.js"
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
import { ReferenceIdentifier, ReferenceIdentifierType } from "./ReferenceIdentifierType.js"

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

export const NestedEntityMap = <Name extends string, T extends TConstraint>(options: {
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

      const primaryReferenceMember = Required({ type: ReferenceIdentifier(parentDecl) })
      const secondaryReferenceMember = Required({
        type: ReferenceIdentifier(options.secondaryEntity),
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

export const isNestedEntityMapType = (node: Node): node is NestedEntityMapType =>
  node.kind === NodeKind.NestedEntityMapType

export const getNestedDeclarationsInNestedEntityMapType = (type: NestedEntityMapType): Decl[] => [
  type.secondaryEntity,
  ...getNestedDeclarationsInObjectType(type.type.value, [
    type.primaryEntityReferenceIdentifierKey!,
    type.secondaryEntityReferenceIdentifierKey!,
  ]),
]

export const validateNestedEntityMapType = (
  validators: Validators,
  type: NestedEntityMapType,
  value: unknown,
): void => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`Expected an object, but got ${JSON.stringify(value)}`)
  }

  Object.keys(value).forEach(key => {
    try {
      validateObjectType(validators, type.type.value, value[key as keyof typeof value])
      validators.checkReferentialIntegrity(
        identifierForSinglePrimaryKeyEntity(type.secondaryEntity, key),
      )
    } catch (error) {
      throw new TypeError(`at nested entity map "${type.name}" at key "${key}"`, { cause: error })
    }
  })
}

export const replaceTypeArgumentsInNestedEntityMapType = (
  args: Record<string, Type>,
  type: NestedEntityMapType,
): NestedEntityMapType =>
  NestedEntityMap({
    ...type,
    type: () => replaceTypeArgumentsInObjectType(args, type.type.value),
  })
