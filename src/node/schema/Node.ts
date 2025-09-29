import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"
import type { SerializedEnumDecl } from "../../shared/schema/declarations/EnumDecl.ts"
import type { SerializedTypeAliasDecl } from "../../shared/schema/declarations/TypeAliasDecl.ts"
import { NodeKind } from "../../shared/schema/Node.ts"
import type { SerializedTypeParameter } from "../../shared/schema/TypeParameter.ts"
import type { SerializedArrayType } from "../../shared/schema/types/ArrayType.ts"
import type { SerializedBooleanType } from "../../shared/schema/types/BooleanType.ts"
import type { SerializedChildEntitiesType } from "../../shared/schema/types/ChildEntitiesType.ts"
import type { SerializedDateType } from "../../shared/schema/types/DateType.ts"
import type {
  SerializedEnumCaseDecl,
  SerializedEnumType,
} from "../../shared/schema/types/EnumType.ts"
import type { SerializedFloatType } from "../../shared/schema/types/FloatType.ts"
import type { SerializedIncludeIdentifierType } from "../../shared/schema/types/IncludeIdentifierType.ts"
import type { SerializedIntegerType } from "../../shared/schema/types/IntegerType.ts"
import type { SerializedNestedEntityMapType } from "../../shared/schema/types/NestedEntityMapType.ts"
import type {
  SerializedMemberDecl,
  SerializedObjectType,
} from "../../shared/schema/types/ObjectType.ts"
import type { SerializedReferenceIdentifierType } from "../../shared/schema/types/ReferenceIdentifierType.ts"
import type { SerializedStringType } from "../../shared/schema/types/StringType.ts"
import type { SerializedTypeArgumentType } from "../../shared/schema/types/TypeArgumentType.ts"
import type { InstancesByEntityName } from "../../shared/utils/instances.ts"
import { assertExhaustive } from "../../shared/utils/typeSafety.ts"
import { entity, json } from "../utils/errorFormatting.ts"
import type { Decl, IncludableDeclP } from "./declarations/Declaration.ts"
import {
  getNestedDeclarationsInEntityDecl,
  getReferencesForEntityDecl,
  resolveTypeArgumentsInEntityDecl,
  serializeEntityDecl,
  validateEntityDecl,
  type EntityDecl,
} from "./declarations/EntityDecl.ts"
import {
  getNestedDeclarationsInEnumDecl,
  getReferencesForEnumDecl,
  resolveTypeArgumentsInEnumDecl,
  serializeEnumDecl,
  validateEnumDecl,
  type EnumDecl,
} from "./declarations/EnumDecl.ts"
import {
  getNestedDeclarationsInTypeAliasDecl,
  getReferencesForTypeAliasDecl,
  resolveTypeArgumentsInTypeAliasDecl,
  serializeTypeAliasDecl,
  validateTypeAliasDecl,
  type TypeAliasDecl,
} from "./declarations/TypeAliasDecl.ts"
import {
  getNestedDeclarationsInTypeParameter,
  getReferencesForTypeParameter,
  resolveTypeArgumentsInTypeParameter,
  serializeTypeParameter,
  type TypeParameter,
} from "./TypeParameter.ts"
import {
  getNestedDeclarationsInArrayType,
  getReferencesForArrayType,
  resolveTypeArgumentsInArrayType,
  serializeArrayType,
  validateArrayType,
  type ArrayType,
} from "./types/generic/ArrayType.ts"
import {
  getNestedDeclarationsInEnumType,
  getReferencesForEnumType,
  resolveTypeArgumentsInEnumType,
  serializeEnumType,
  validateEnumType,
  type EnumCaseDecl,
  type EnumType,
} from "./types/generic/EnumType.ts"
import {
  getNestedDeclarationsInObjectType,
  getReferencesForObjectType,
  resolveTypeArgumentsInObjectType,
  serializeObjectType,
  validateObjectType,
  type MemberDecl,
  type ObjectType,
} from "./types/generic/ObjectType.ts"
import {
  getNestedDeclarationsInBooleanType,
  getReferencesForBooleanType,
  resolveTypeArgumentsInBooleanType,
  serializeBooleanType,
  validateBooleanType,
  type BooleanType,
} from "./types/primitives/BooleanType.ts"
import {
  getNestedDeclarationsInDateType,
  getReferencesForDateType,
  resolveTypeArgumentsInDateType,
  serializeDateType,
  validateDateType,
  type DateType,
} from "./types/primitives/DateType.ts"
import {
  getNestedDeclarationsInFloatType,
  getReferencesForFloatType,
  resolveTypeArgumentsInFloatType,
  serializeFloatType,
  validateFloatType,
  type FloatType,
} from "./types/primitives/FloatType.ts"
import {
  getNestedDeclarationsInIntegerType,
  getReferencesForIntegerType,
  resolveTypeArgumentsInIntegerType,
  serializeIntegerType,
  validateIntegerType,
  type IntegerType,
} from "./types/primitives/IntegerType.ts"
import {
  getNestedDeclarationsInStringType,
  getReferencesForStringType,
  resolveTypeArgumentsInStringType,
  serializeStringType,
  validateStringType,
  type StringType,
} from "./types/primitives/StringType.ts"
import {
  getNestedDeclarationsInChildEntitiesType,
  getReferencesForChildEntitiesType,
  resolveTypeArgumentsInChildEntitiesType,
  serializeChildEntitiesType,
  validateChildEntitiesType,
  type ChildEntitiesType,
} from "./types/references/ChildEntitiesType.ts"
import {
  getNestedDeclarationsInIncludeIdentifierType,
  getReferencesForIncludeIdentifierType,
  resolveTypeArgumentsInIncludeIdentifierType,
  serializeIncludeIdentifierType,
  validateIncludeIdentifierType,
  type IncludeIdentifierType,
} from "./types/references/IncludeIdentifierType.ts"
import {
  getNestedDeclarationsInNestedEntityMapType,
  getReferencesForNestedEntityMapType,
  resolveTypeArgumentsInNestedEntityMapType,
  serializeNestedEntityMapType,
  validateNestedEntityMapType,
  type NestedEntityMapType,
} from "./types/references/NestedEntityMapType.ts"
import {
  getNestedDeclarationsInReferenceIdentifierType,
  getReferencesForReferenceIdentifierType,
  resolveTypeArgumentsInReferenceIdentifierType,
  serializeReferenceIdentifierType,
  validateReferenceIdentifierType,
  type ReferenceIdentifierType,
} from "./types/references/ReferenceIdentifierType.ts"
import {
  getNestedDeclarationsInTypeArgumentType,
  getReferencesForTypeArgumentType,
  resolveTypeArgumentsInTypeArgumentType,
  serializeTypeArgumentType,
  validateTypeArgumentType,
  type TypeArgumentType,
} from "./types/references/TypeArgumentType.ts"
import type { Type } from "./types/Type.ts"
export type { BaseNode } from "../../shared/schema/Node.ts"
export { NodeKind }

export type Node = Decl | Type | TypeParameter

export const flatMapAuxiliaryDecls = (
  callbackFn: (
    parentNodes: Node[],
    node: Node,
    existingDecls: Decl[],
  ) => (Decl | undefined)[] | Decl | undefined,
  declarations: readonly Decl[],
): Decl[] => {
  const mapNodeTree = (
    callbackFn: (parentNodes: Node[], node: Node, decls: Decl[]) => Decl[],
    parentNodes: Node[],
    node: Node,
    decls: Decl[],
  ): Decl[] => {
    switch (node.kind) {
      case NodeKind.EntityDecl: {
        const newDecls = callbackFn(parentNodes, node, decls)
        return mapNodeTree(callbackFn, [node], node.type.value, newDecls)
      }

      case NodeKind.EnumDecl: {
        const newDecls = callbackFn(parentNodes, node, decls)
        return mapNodeTree(callbackFn, [node], node.type.value, newDecls)
      }

      case NodeKind.TypeAliasDecl: {
        const newDecls = callbackFn(parentNodes, node, decls)
        return mapNodeTree(callbackFn, [node], node.type.value, newDecls)
      }

      case NodeKind.ArrayType: {
        const newDecls = callbackFn(parentNodes, node, decls)
        return mapNodeTree(callbackFn, [...parentNodes, node], node.items, newDecls)
      }

      case NodeKind.ObjectType: {
        const newDecls = callbackFn(parentNodes, node, decls)
        return Object.values(node.properties).reduce(
          (newDeclsAcc, prop) =>
            mapNodeTree(callbackFn, [...parentNodes, node], prop.type, newDeclsAcc),
          newDecls,
        )
      }
      case NodeKind.BooleanType:
      case NodeKind.DateType:
      case NodeKind.FloatType:
      case NodeKind.IntegerType:
      case NodeKind.StringType:
      case NodeKind.TypeArgumentType:
      case NodeKind.ReferenceIdentifierType:
      case NodeKind.IncludeIdentifierType:
      case NodeKind.NestedEntityMapType:
      case NodeKind.TypeParameter:
      case NodeKind.ChildEntitiesType:
        return callbackFn(parentNodes, node, decls)

      case NodeKind.EnumType: {
        const newDecls = callbackFn(parentNodes, node, decls)
        return Object.values(node.values).reduce(
          (newDeclsAcc, caseDef) =>
            caseDef.type === null
              ? newDecls
              : mapNodeTree(callbackFn, [...parentNodes, node], caseDef.type, newDeclsAcc),
          newDecls,
        )
      }

      default:
        return assertExhaustive(node)
    }
  }

  const reducer = (parentNodes: Node[], node: Node, decls: Decl[]): Decl[] => {
    const result = callbackFn(parentNodes, node, decls)
    const normalizedResult = (Array.isArray(result) ? result : [result]).filter(
      decl => decl !== undefined,
    )
    normalizedResult.forEach(decl => {
      const existingDeclWithSameName = decls.find(
        existingDecl => existingDecl !== decl && existingDecl.name === decl.name,
      )
      if (existingDeclWithSameName) {
        throw new Error(
          `Duplicate declaration name: "${decl.name}" in "${decl.sourceUrl}" and "${existingDeclWithSameName.sourceUrl}". Make sure declaration names are globally unique.`,
        )
      }
    })
    return decls.concat(normalizedResult)
  }

  return declarations.reduce(
    (decls: Decl[], node) => mapNodeTree(reducer, [], node, [...decls, node]),
    [],
  )
}

export type IdentifierToCheck = { name: string; value: unknown }

export interface Validators {
  useStyling: boolean
  checkReferentialIntegrity: (identifier: IdentifierToCheck) => Error[]
}

export const createValidators = (
  instancesByEntityName: InstancesByEntityName,
  useStyling: boolean,
  checkReferentialIntegrity: boolean = true,
): Validators => ({
  useStyling,
  checkReferentialIntegrity: checkReferentialIntegrity
    ? ({ name, value }) =>
        instancesByEntityName[name]?.some(
          instance =>
            typeof instance.content === "object" &&
            instance.content !== null &&
            !Array.isArray(instance.content) &&
            instance.id === value,
        )
          ? []
          : [
              ReferenceError(
                `Invalid reference to instance of entity ${entity(`"${name}"`, useStyling)} with identifier ${json(
                  value,
                  useStyling,
                )}`,
              ),
            ]
    : () => [],
})

export type Predicate<T extends Node> = (node: Node) => node is T

export type GetNestedDeclarations<T extends Node = Node> = (addedDecls: Decl[], node: T) => Decl[]

export const getNestedDeclarations: GetNestedDeclarations = (addedDecls, node) => {
  switch (node.kind) {
    case NodeKind.EntityDecl:
      return getNestedDeclarationsInEntityDecl(addedDecls, node)
    case NodeKind.EnumDecl:
      return getNestedDeclarationsInEnumDecl(addedDecls, node)
    case NodeKind.TypeAliasDecl:
      return getNestedDeclarationsInTypeAliasDecl(addedDecls, node)
    case NodeKind.ArrayType:
      return getNestedDeclarationsInArrayType(addedDecls, node)
    case NodeKind.ObjectType:
      return getNestedDeclarationsInObjectType(addedDecls, node)
    case NodeKind.BooleanType:
      return getNestedDeclarationsInBooleanType(addedDecls, node)
    case NodeKind.DateType:
      return getNestedDeclarationsInDateType(addedDecls, node)
    case NodeKind.FloatType:
      return getNestedDeclarationsInFloatType(addedDecls, node)
    case NodeKind.IntegerType:
      return getNestedDeclarationsInIntegerType(addedDecls, node)
    case NodeKind.StringType:
      return getNestedDeclarationsInStringType(addedDecls, node)
    case NodeKind.TypeArgumentType:
      return getNestedDeclarationsInTypeArgumentType(addedDecls, node)
    case NodeKind.ReferenceIdentifierType:
      return getNestedDeclarationsInReferenceIdentifierType(addedDecls, node)
    case NodeKind.IncludeIdentifierType:
      return getNestedDeclarationsInIncludeIdentifierType(addedDecls, node)
    case NodeKind.NestedEntityMapType:
      return getNestedDeclarationsInNestedEntityMapType(addedDecls, node)
    case NodeKind.EnumType:
      return getNestedDeclarationsInEnumType(addedDecls, node)
    case NodeKind.TypeParameter:
      return getNestedDeclarationsInTypeParameter(addedDecls, node)
    case NodeKind.ChildEntitiesType:
      return getNestedDeclarationsInChildEntitiesType(addedDecls, node)
    default:
      return assertExhaustive(node)
  }
}

export type Validator<T extends Node = Node> = (
  helpers: Validators,
  node: T,
  value: unknown,
) => Error[]

export type ValidatorOfParamDecl<T extends Node = Node> = (
  helpers: Validators,
  node: T,
  typeArgs: Type[],
  value: unknown,
) => Error[]

export const validateDecl: ValidatorOfParamDecl<Decl> = (helpers, decl, typeArgs, value) => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return validateEntityDecl(helpers, decl, value)
    case NodeKind.EnumDecl:
      return validateEnumDecl(helpers, decl, typeArgs, value)
    case NodeKind.TypeAliasDecl:
      return validateTypeAliasDecl(helpers, decl, typeArgs, value)
    default:
      return assertExhaustive(decl)
  }
}

export const validateType: Validator<Type> = (helpers, type, value) => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return validateArrayType(helpers, type, value)
    case NodeKind.ObjectType:
      return validateObjectType(helpers, type, value)
    case NodeKind.BooleanType:
      return validateBooleanType(helpers, type, value)
    case NodeKind.DateType:
      return validateDateType(helpers, type, value)
    case NodeKind.FloatType:
      return validateFloatType(helpers, type, value)
    case NodeKind.IntegerType:
      return validateIntegerType(helpers, type, value)
    case NodeKind.StringType:
      return validateStringType(helpers, type, value)
    case NodeKind.TypeArgumentType:
      return validateTypeArgumentType(helpers, type, value)
    case NodeKind.ReferenceIdentifierType:
      return validateReferenceIdentifierType(helpers, type, value)
    case NodeKind.IncludeIdentifierType:
      return validateIncludeIdentifierType(helpers, type, value)
    case NodeKind.NestedEntityMapType:
      return validateNestedEntityMapType(helpers, type, value)
    case NodeKind.EnumType:
      return validateEnumType(helpers, type, value)
    case NodeKind.ChildEntitiesType:
      return validateChildEntitiesType(helpers, type, value)
    default:
      return assertExhaustive(type)
  }
}

export type NodeWithResolvedTypeArguments<T extends Node | null> = T extends
  | BooleanType
  | DateType
  | FloatType
  | IntegerType
  | StringType
  | ReferenceIdentifierType
  ? T
  : T extends EntityDecl<infer N, infer V>
    ? EntityDecl<N, NodeWithResolvedTypeArguments<V>>
    : T extends EnumDecl<infer N, infer V, TypeParameter[]>
      ? EnumDecl<
          N,
          {
            [K in keyof V]: V[K] extends EnumCaseDecl<infer CT>
              ? EnumCaseDecl<NodeWithResolvedTypeArguments<CT>>
              : never
          },
          []
        >
      : T extends TypeAliasDecl<infer N, infer U, TypeParameter[]>
        ? TypeAliasDecl<N, NodeWithResolvedTypeArguments<U>, []>
        : T extends ArrayType<infer I>
          ? ArrayType<NodeWithResolvedTypeArguments<I>>
          : T extends EnumType<infer V>
            ? EnumType<{
                [K in keyof V]: V[K] extends EnumCaseDecl<infer CT>
                  ? EnumCaseDecl<NodeWithResolvedTypeArguments<CT>>
                  : never
              }>
            : T extends ObjectType<infer P>
              ? ObjectType<{
                  [K in keyof P]: P[K] extends MemberDecl<infer PT, infer R>
                    ? MemberDecl<NodeWithResolvedTypeArguments<PT>, R>
                    : never
                }>
              : T extends TypeArgumentType
                ? Type
                : T extends IncludeIdentifierType<[], IncludableDeclP<[]>>
                  ? T
                  : T extends IncludeIdentifierType
                    ? Type
                    : T extends NestedEntityMapType<infer N, infer P>
                      ? NestedEntityMapType<
                          N,
                          {
                            [K in keyof P]: P[K] extends MemberDecl<infer PT, infer R>
                              ? MemberDecl<NodeWithResolvedTypeArguments<PT>, R>
                              : never
                          }
                        >
                      : T extends TypeParameter<infer N, infer C>
                        ? TypeParameter<N, NodeWithResolvedTypeArguments<C>>
                        : T extends ChildEntitiesType<infer E, infer P>
                          ? ChildEntitiesType<E, P>
                          : T extends null
                            ? null
                            : never

export type TypeArgumentsResolver<T extends Node = Node> = (
  args: Record<string, Type>,
  node: T,
) => NodeWithResolvedTypeArguments<T>

export const resolveTypeArguments = <T extends Node = Node>(
  args: Record<string, Type>,
  node: T,
): NodeWithResolvedTypeArguments<T> => {
  type NT = NodeWithResolvedTypeArguments<T>

  switch (node.kind) {
    case NodeKind.EntityDecl:
      return resolveTypeArgumentsInEntityDecl(args, node) as NT
    case NodeKind.EnumDecl:
      return resolveTypeArgumentsInEnumDecl(args, node) as NT
    case NodeKind.TypeAliasDecl:
      return resolveTypeArgumentsInTypeAliasDecl(args, node) as NT
    case NodeKind.ArrayType:
      return resolveTypeArgumentsInArrayType(args, node) as NT
    case NodeKind.ObjectType:
      return resolveTypeArgumentsInObjectType(args, node) as NT
    case NodeKind.BooleanType:
      return resolveTypeArgumentsInBooleanType(args, node) as NT
    case NodeKind.DateType:
      return resolveTypeArgumentsInDateType(args, node) as NT
    case NodeKind.FloatType:
      return resolveTypeArgumentsInFloatType(args, node) as NT
    case NodeKind.IntegerType:
      return resolveTypeArgumentsInIntegerType(args, node) as NT
    case NodeKind.StringType:
      return resolveTypeArgumentsInStringType(args, node) as NT
    case NodeKind.TypeArgumentType:
      return resolveTypeArgumentsInTypeArgumentType(args, node) as NT
    case NodeKind.ReferenceIdentifierType:
      return resolveTypeArgumentsInReferenceIdentifierType(args, node) as NT
    case NodeKind.IncludeIdentifierType:
      return resolveTypeArgumentsInIncludeIdentifierType(args, node) as NT
    case NodeKind.NestedEntityMapType:
      return resolveTypeArgumentsInNestedEntityMapType(args, node) as NT
    case NodeKind.EnumType:
      return resolveTypeArgumentsInEnumType(args, node) as NT
    case NodeKind.TypeParameter:
      return resolveTypeArgumentsInTypeParameter(args, node) as NT
    case NodeKind.ChildEntitiesType:
      return resolveTypeArgumentsInChildEntitiesType(args, node) as NT
    default:
      return assertExhaustive(node)
  }
}

export type SerializedNodeMap = {
  [NodeKind.EntityDecl]: [EntityDecl, SerializedEntityDecl]
  [NodeKind.EnumDecl]: [EnumDecl, SerializedEnumDecl]
  [NodeKind.TypeAliasDecl]: [TypeAliasDecl, SerializedTypeAliasDecl]
  [NodeKind.ArrayType]: [ArrayType, SerializedArrayType]
  [NodeKind.ObjectType]: [ObjectType, SerializedObjectType]
  [NodeKind.BooleanType]: [BooleanType, SerializedBooleanType]
  [NodeKind.DateType]: [DateType, SerializedDateType]
  [NodeKind.FloatType]: [FloatType, SerializedFloatType]
  [NodeKind.IntegerType]: [IntegerType, SerializedIntegerType]
  [NodeKind.StringType]: [StringType, SerializedStringType]
  [NodeKind.TypeArgumentType]: [TypeArgumentType, SerializedTypeArgumentType]
  [NodeKind.ReferenceIdentifierType]: [ReferenceIdentifierType, SerializedReferenceIdentifierType]
  [NodeKind.IncludeIdentifierType]: [IncludeIdentifierType, SerializedIncludeIdentifierType]
  [NodeKind.NestedEntityMapType]: [NestedEntityMapType, SerializedNestedEntityMapType]
  [NodeKind.EnumType]: [EnumType, SerializedEnumType]
  [NodeKind.TypeParameter]: [TypeParameter, SerializedTypeParameter]
  [NodeKind.ChildEntitiesType]: [ChildEntitiesType, SerializedChildEntitiesType]
}

export type SerializedTypeParameters<T extends TypeParameter[]> = {
  [K in keyof T]: T[K] extends TypeParameter<infer N, infer C>
    ? SerializedTypeParameter<N, C extends Type ? Serialized<C> : undefined>
    : never
}

// prettier-ignore
export type Serialized<T extends Node> =
  T extends EntityDecl<infer Name, infer T> ? SerializedEntityDecl<Name, Serialized<T>> :
  T extends EnumDecl<infer Name, infer T, infer Params> ? SerializedEnumDecl<Name, {
    [K in keyof T]: T[K] extends EnumCaseDecl<infer CT>
      ? SerializedEnumCaseDecl<CT extends Type ? Serialized<CT> : null>
      : never
  }, SerializedTypeParameters<Params>> :
  T extends TypeAliasDecl<infer Name, infer T, infer Params> ? SerializedTypeAliasDecl<Name, Serialized<T>, SerializedTypeParameters<Params>> :
  T extends ArrayType<infer T> ? SerializedArrayType<Serialized<T>> :
  T extends ObjectType<infer T> ? SerializedObjectType<{
    [K in keyof T]: T[K] extends MemberDecl<infer CT, infer R>
      ? SerializedMemberDecl<CT extends Type ? Serialized<CT> : null, R>
      : never
  }> :
  T extends BooleanType ? SerializedBooleanType :
  T extends DateType ? SerializedDateType :
  T extends FloatType ? SerializedFloatType :
  T extends IntegerType ? SerializedIntegerType :
  T extends StringType ? SerializedStringType :
  T extends TypeArgumentType<infer T> ? SerializedTypeArgumentType<Serialized<T>> :
  T extends ReferenceIdentifierType ? SerializedReferenceIdentifierType :
  T extends IncludeIdentifierType<infer Params> ? SerializedIncludeIdentifierType<SerializedTypeParameters<Params>> :
  T extends NestedEntityMapType<infer Name, infer T> ? SerializedNestedEntityMapType<Name, {
    [K in keyof T]: T[K] extends MemberDecl<infer CT, infer R>
      ? SerializedMemberDecl<CT extends Type ? Serialized<CT> : null, R>
      : never
  }> :
  T extends EnumType<infer T> ? SerializedEnumType<{
    [K in keyof T]: T[K] extends EnumCaseDecl<infer CT>
      ? SerializedEnumCaseDecl<CT extends Type ? Serialized<CT> : null>
      : never
  }> :
  T extends TypeParameter<infer N, infer C> ? SerializedTypeParameter<N, C extends Type ? Serialized<C> : undefined> :
  T extends ChildEntitiesType ? SerializedChildEntitiesType :
  never

export type SerializedOf<T extends Node> = SerializedNodeMap[T["kind"]][1]

export type Serializer<T extends Node = Node> = <N extends T>(node: N) => SerializedOf<N>

export const serializeNode: Serializer = node => {
  switch (node.kind) {
    case NodeKind.EntityDecl:
      return serializeEntityDecl(node)
    case NodeKind.EnumDecl:
      return serializeEnumDecl(node)
    case NodeKind.TypeAliasDecl:
      return serializeTypeAliasDecl(node)
    case NodeKind.ArrayType:
      return serializeArrayType(node)
    case NodeKind.ObjectType:
      return serializeObjectType(node)
    case NodeKind.BooleanType:
      return serializeBooleanType(node)
    case NodeKind.DateType:
      return serializeDateType(node)
    case NodeKind.FloatType:
      return serializeFloatType(node)
    case NodeKind.IntegerType:
      return serializeIntegerType(node)
    case NodeKind.StringType:
      return serializeStringType(node)
    case NodeKind.TypeArgumentType:
      return serializeTypeArgumentType(node)
    case NodeKind.ReferenceIdentifierType:
      return serializeReferenceIdentifierType(node)
    case NodeKind.IncludeIdentifierType:
      return serializeIncludeIdentifierType(node)
    case NodeKind.NestedEntityMapType:
      return serializeNestedEntityMapType(node)
    case NodeKind.EnumType:
      return serializeEnumType(node)
    case NodeKind.TypeParameter:
      return serializeTypeParameter(node)
    case NodeKind.ChildEntitiesType:
      return serializeChildEntitiesType(node)
    default:
      return assertExhaustive(node)
  }
}

export type GetReferences<T extends Node = Node> = (node: T, value: unknown) => string[]

export const getReferences: GetReferences = (node, value) => {
  switch (node.kind) {
    case NodeKind.EntityDecl:
      return getReferencesForEntityDecl(node, value)
    case NodeKind.EnumDecl:
      return getReferencesForEnumDecl(node, value)
    case NodeKind.TypeAliasDecl:
      return getReferencesForTypeAliasDecl(node, value)
    case NodeKind.ArrayType:
      return getReferencesForArrayType(node, value)
    case NodeKind.ObjectType:
      return getReferencesForObjectType(node, value)
    case NodeKind.BooleanType:
      return getReferencesForBooleanType(node, value)
    case NodeKind.DateType:
      return getReferencesForDateType(node, value)
    case NodeKind.FloatType:
      return getReferencesForFloatType(node, value)
    case NodeKind.IntegerType:
      return getReferencesForIntegerType(node, value)
    case NodeKind.StringType:
      return getReferencesForStringType(node, value)
    case NodeKind.TypeArgumentType:
      return getReferencesForTypeArgumentType(node, value)
    case NodeKind.ReferenceIdentifierType:
      return getReferencesForReferenceIdentifierType(node, value)
    case NodeKind.IncludeIdentifierType:
      return getReferencesForIncludeIdentifierType(node, value)
    case NodeKind.NestedEntityMapType:
      return getReferencesForNestedEntityMapType(node, value)
    case NodeKind.EnumType:
      return getReferencesForEnumType(node, value)
    case NodeKind.TypeParameter:
      return getReferencesForTypeParameter(node, value)
    case NodeKind.ChildEntitiesType:
      return getReferencesForChildEntitiesType(node, value)
    default:
      return assertExhaustive(node)
  }
}
