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
import { isDecl, type Decl, type IncludableDeclP } from "./declarations/Declaration.ts"
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

export type NestedDecl = Decl | NestedEntity

export type NestedEntity = {
  kind: "NestedEntity"
  sourceUrl: string
  name: string
  type: NestedEntityMapType
}

export const reduceNodes = <R>(
  reducer: (parentNodes: Node[], node: Node, collectedResults: R[]) => R[],
  nodes: readonly Node[],
  options: {
    initialResults?: R[]
    followIncludes?: boolean
    followChildEntities?: boolean
  } = {},
): R[] => {
  const { initialResults = [], followIncludes = false, followChildEntities = false } = options

  const reduceNodeTree = (
    parentNodes: Node[],
    node: Node,
    collectedResults: R[],
    reducedDecls: Decl[],
  ): { results: R[]; reducedDecls: Decl[] } => {
    switch (node.kind) {
      case NodeKind.EntityDecl:
      case NodeKind.EnumDecl:
      case NodeKind.TypeAliasDecl:
        return reduceNodeTree(
          [node],
          node.type.value,
          reducer(parentNodes, node, collectedResults),
          [...reducedDecls, node],
        )

      case NodeKind.ArrayType:
        return reduceNodeTree(
          [...parentNodes, node],
          node.items,
          reducer(parentNodes, node, collectedResults),
          reducedDecls,
        )

      case NodeKind.ObjectType:
        return Object.values(node.properties).reduce(
          (collectedResultsAcc, prop) =>
            reduceNodeTree(
              [...parentNodes, node],
              prop.type,
              collectedResultsAcc.results,
              collectedResultsAcc.reducedDecls,
            ),
          { results: reducer(parentNodes, node, collectedResults), reducedDecls },
        )

      case NodeKind.EnumType:
        return Object.values(node.values).reduce(
          (collectedResultsAcc, caseDef) =>
            caseDef.type === null
              ? collectedResultsAcc
              : reduceNodeTree(
                  [...parentNodes, node],
                  caseDef.type,
                  collectedResultsAcc.results,
                  collectedResultsAcc.reducedDecls,
                ),
          { results: reducer(parentNodes, node, collectedResults), reducedDecls },
        )

      case NodeKind.IncludeIdentifierType:
        if (followIncludes && !reducedDecls.includes(node.reference)) {
          return reduceNodeTree(
            [],
            node.reference,
            reducer(parentNodes, node, collectedResults),
            reducedDecls,
          )
        } else {
          return { results: reducer(parentNodes, node, collectedResults), reducedDecls }
        }

      case NodeKind.ChildEntitiesType:
        if (followChildEntities && !reducedDecls.includes(node.entity)) {
          return reduceNodeTree(
            [],
            node.entity,
            reducer(parentNodes, node, collectedResults),
            reducedDecls,
          )
        } else {
          return { results: reducer(parentNodes, node, collectedResults), reducedDecls }
        }

      case NodeKind.BooleanType:
      case NodeKind.DateType:
      case NodeKind.FloatType:
      case NodeKind.IntegerType:
      case NodeKind.StringType:
      case NodeKind.TypeArgumentType:
      case NodeKind.ReferenceIdentifierType:
      case NodeKind.NestedEntityMapType:
      case NodeKind.TypeParameter:
        return { results: reducer(parentNodes, node, collectedResults), reducedDecls }

      default:
        return assertExhaustive(node)
    }
  }

  return nodes.reduce<{ results: R[]; reducedDecls: Decl[] }>(
    ({ results, reducedDecls }, node) => reduceNodeTree([], node, results, reducedDecls),
    { results: initialResults, reducedDecls: [] },
  ).results
}

export const flatMapAuxiliaryDecls = (
  callbackFn: (
    parentNodes: Node[],
    node: Node,
    existingDecls: Decl[],
  ) => (Decl | undefined)[] | Decl | undefined,
  declarations: readonly Decl[],
): Decl[] =>
  reduceNodes((parentNodes, node, decls) => {
    const declsWithCurrentDecl = isDecl(node) ? [...decls, node] : decls
    const result = callbackFn(parentNodes, node, declsWithCurrentDecl)
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
    return declsWithCurrentDecl.concat(normalizedResult)
  }, declarations)

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

export type GetNestedDeclarations<T extends Node = Node> = (
  addedDecls: NestedDecl[],
  node: T,
  parentDecl: Decl | undefined,
) => NestedDecl[]

export const getNestedDeclarations: GetNestedDeclarations = (addedDecls, node, parentDecl) => {
  switch (node.kind) {
    case NodeKind.EntityDecl:
      return addedDecls.includes(node)
        ? addedDecls
        : getNestedDeclarationsInEntityDecl([...addedDecls, node], node, parentDecl)
    case NodeKind.EnumDecl:
      return addedDecls.includes(node)
        ? addedDecls
        : getNestedDeclarationsInEnumDecl([...addedDecls, node], node, parentDecl)
    case NodeKind.TypeAliasDecl:
      return addedDecls.includes(node)
        ? addedDecls
        : getNestedDeclarationsInTypeAliasDecl([...addedDecls, node], node, parentDecl)
    case NodeKind.ArrayType:
      return getNestedDeclarationsInArrayType(addedDecls, node, parentDecl)
    case NodeKind.ObjectType:
      return getNestedDeclarationsInObjectType(addedDecls, node, parentDecl)
    case NodeKind.BooleanType:
      return getNestedDeclarationsInBooleanType(addedDecls, node, parentDecl)
    case NodeKind.DateType:
      return getNestedDeclarationsInDateType(addedDecls, node, parentDecl)
    case NodeKind.FloatType:
      return getNestedDeclarationsInFloatType(addedDecls, node, parentDecl)
    case NodeKind.IntegerType:
      return getNestedDeclarationsInIntegerType(addedDecls, node, parentDecl)
    case NodeKind.StringType:
      return getNestedDeclarationsInStringType(addedDecls, node, parentDecl)
    case NodeKind.TypeArgumentType:
      return getNestedDeclarationsInTypeArgumentType(addedDecls, node, parentDecl)
    case NodeKind.ReferenceIdentifierType:
      return getNestedDeclarationsInReferenceIdentifierType(addedDecls, node, parentDecl)
    case NodeKind.IncludeIdentifierType:
      return getNestedDeclarationsInIncludeIdentifierType(addedDecls, node, parentDecl)
    case NodeKind.NestedEntityMapType:
      return addedDecls.some(
        addedDecl => addedDecl.kind === "NestedEntity" && addedDecl.type === node,
      )
        ? addedDecls
        : getNestedDeclarationsInNestedEntityMapType(
            [
              ...addedDecls,
              {
                kind: "NestedEntity",
                sourceUrl: parentDecl?.sourceUrl ?? "",
                name: node.name,
                type: node,
              },
            ],
            node,
            parentDecl,
          )
    case NodeKind.EnumType:
      return getNestedDeclarationsInEnumType(addedDecls, node, parentDecl)
    case NodeKind.TypeParameter:
      return getNestedDeclarationsInTypeParameter(addedDecls, node, parentDecl)
    case NodeKind.ChildEntitiesType:
      return getNestedDeclarationsInChildEntitiesType(addedDecls, node, parentDecl)
    default:
      return assertExhaustive(node)
  }
}

export type Validator<T extends Node = Node> = (
  helpers: Validators,
  inDecls: Decl[],
  node: T,
  value: unknown,
) => Error[]

export type ValidatorOfParamDecl<T extends Node = Node> = (
  helpers: Validators,
  inDecls: Decl[],
  node: T,
  typeArgs: Type[],
  value: unknown,
) => Error[]

export const validateDecl: ValidatorOfParamDecl<Decl> = (
  helpers,
  inDecls,
  decl,
  typeArgs,
  value,
) => {
  switch (decl.kind) {
    case NodeKind.EntityDecl:
      return validateEntityDecl(helpers, inDecls, decl, value)
    case NodeKind.EnumDecl:
      return validateEnumDecl(helpers, inDecls, decl, typeArgs, value)
    case NodeKind.TypeAliasDecl:
      return validateTypeAliasDecl(helpers, inDecls, decl, typeArgs, value)
    default:
      return assertExhaustive(decl)
  }
}

export const validateType: Validator<Type> = (helpers, inDecls, type, value) => {
  switch (type.kind) {
    case NodeKind.ArrayType:
      return validateArrayType(helpers, inDecls, type, value)
    case NodeKind.ObjectType:
      return validateObjectType(helpers, inDecls, type, value)
    case NodeKind.BooleanType:
      return validateBooleanType(helpers, inDecls, type, value)
    case NodeKind.DateType:
      return validateDateType(helpers, inDecls, type, value)
    case NodeKind.FloatType:
      return validateFloatType(helpers, inDecls, type, value)
    case NodeKind.IntegerType:
      return validateIntegerType(helpers, inDecls, type, value)
    case NodeKind.StringType:
      return validateStringType(helpers, inDecls, type, value)
    case NodeKind.TypeArgumentType:
      return validateTypeArgumentType(helpers, inDecls, type, value)
    case NodeKind.ReferenceIdentifierType:
      return validateReferenceIdentifierType(helpers, inDecls, type, value)
    case NodeKind.IncludeIdentifierType:
      return validateIncludeIdentifierType(helpers, inDecls, type, value)
    case NodeKind.NestedEntityMapType:
      return validateNestedEntityMapType(helpers, inDecls, type, value)
    case NodeKind.EnumType:
      return validateEnumType(helpers, inDecls, type, value)
    case NodeKind.ChildEntitiesType:
      return validateChildEntitiesType(helpers, inDecls, type, value)
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
  : T extends EntityDecl<infer N, infer P, infer FK>
    ? EntityDecl<
        N,
        {
          [K in keyof P]: P[K] extends MemberDecl<infer PT, infer R>
            ? MemberDecl<NodeWithResolvedTypeArguments<PT>, R>
            : never
        },
        FK
      >
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
                        : T extends ChildEntitiesType<infer E>
                          ? ChildEntitiesType<E>
                          : T extends null
                            ? null
                            : never

export type TypeArgumentsResolver<T extends Node = Node> = (
  args: Record<string, Type>,
  node: T,
  inDecl: Decl[],
) => NodeWithResolvedTypeArguments<T>

export const resolveTypeArguments = <T extends Node = Node>(
  args: Record<string, Type>,
  node: T,
  inDecl: Decl[],
): NodeWithResolvedTypeArguments<T> => {
  type NT = NodeWithResolvedTypeArguments<T>

  switch (node.kind) {
    case NodeKind.EntityDecl:
      return resolveTypeArgumentsInEntityDecl(args, node, inDecl) as NT
    case NodeKind.EnumDecl:
      return resolveTypeArgumentsInEnumDecl(args, node, inDecl) as NT
    case NodeKind.TypeAliasDecl:
      return resolveTypeArgumentsInTypeAliasDecl(args, node, inDecl) as NT
    case NodeKind.ArrayType:
      return resolveTypeArgumentsInArrayType(args, node, inDecl) as NT
    case NodeKind.ObjectType:
      return resolveTypeArgumentsInObjectType(args, node, inDecl) as NT
    case NodeKind.BooleanType:
      return resolveTypeArgumentsInBooleanType(args, node, inDecl) as NT
    case NodeKind.DateType:
      return resolveTypeArgumentsInDateType(args, node, inDecl) as NT
    case NodeKind.FloatType:
      return resolveTypeArgumentsInFloatType(args, node, inDecl) as NT
    case NodeKind.IntegerType:
      return resolveTypeArgumentsInIntegerType(args, node, inDecl) as NT
    case NodeKind.StringType:
      return resolveTypeArgumentsInStringType(args, node, inDecl) as NT
    case NodeKind.TypeArgumentType:
      return resolveTypeArgumentsInTypeArgumentType(args, node) as NT
    case NodeKind.ReferenceIdentifierType:
      return resolveTypeArgumentsInReferenceIdentifierType(args, node, inDecl) as NT
    case NodeKind.IncludeIdentifierType:
      return resolveTypeArgumentsInIncludeIdentifierType(args, node, inDecl) as NT
    case NodeKind.NestedEntityMapType:
      return resolveTypeArgumentsInNestedEntityMapType(args, node, inDecl) as NT
    case NodeKind.EnumType:
      return resolveTypeArgumentsInEnumType(args, node, inDecl) as NT
    case NodeKind.TypeParameter:
      return resolveTypeArgumentsInTypeParameter(args, node, inDecl) as NT
    case NodeKind.ChildEntitiesType:
      return resolveTypeArgumentsInChildEntitiesType(args, node, inDecl) as NT
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

export type SerializedMemberDeclObject<T extends Record<string, MemberDecl>> = {
  [K in keyof T]: T[K] extends MemberDecl<infer CT, infer R>
    ? SerializedMemberDecl<Serialized<CT>, R>
    : never
}

export type SerializedEnumCaseDeclObject<T extends Record<string, EnumCaseDecl>> = {
  [K in keyof T]: T[K] extends EnumCaseDecl<infer CT>
    ? SerializedEnumCaseDecl<CT extends Type ? Serialized<CT> : null>
    : never
}

// prettier-ignore
export type Serialized<T extends Node> =
  T extends EntityDecl<infer Name, infer T, infer FK> ? SerializedEntityDecl<Name, SerializedMemberDeclObject<T>, FK> :
  T extends EnumDecl<infer Name, infer T, infer Params> ? SerializedEnumDecl<Name, SerializedEnumCaseDeclObject<T>, SerializedTypeParameters<Params>> :
  T extends TypeAliasDecl<infer Name, infer T, infer Params> ? SerializedTypeAliasDecl<Name, Serialized<T>, SerializedTypeParameters<Params>> :
  T extends ArrayType<infer T> ? SerializedArrayType<Serialized<T>> :
  T extends ObjectType<infer T> ? SerializedObjectType<SerializedMemberDeclObject<T>> :
  T extends BooleanType ? SerializedBooleanType :
  T extends DateType ? SerializedDateType :
  T extends FloatType ? SerializedFloatType :
  T extends IntegerType ? SerializedIntegerType :
  T extends StringType ? SerializedStringType :
  T extends TypeArgumentType<infer T> ? SerializedTypeArgumentType<Serialized<T>> :
  T extends ReferenceIdentifierType ? SerializedReferenceIdentifierType :
  T extends IncludeIdentifierType<infer Params> ? SerializedIncludeIdentifierType<SerializedTypeParameters<Params>> :
  T extends NestedEntityMapType<infer Name, infer T> ? SerializedNestedEntityMapType<Name, SerializedMemberDeclObject<T>> :
  T extends EnumType<infer T> ? SerializedEnumType<SerializedEnumCaseDeclObject<T>> :
  T extends TypeParameter<infer N, infer C> ? SerializedTypeParameter<N, C extends Type ? Serialized<C> : undefined> :
  T extends ChildEntitiesType ? SerializedChildEntitiesType :
  never

export type SerializedOf<T extends Node> = SerializedNodeMap[T["kind"]][1]

export type Serializer<T extends Node = Node> = (node: T) => Serialized<T>

export const serializeNode = <T extends Node>(node: T): Serialized<T> => {
  type SN = Serialized<T>
  switch (node.kind) {
    case NodeKind.EntityDecl:
      return serializeEntityDecl(node) as SN
    case NodeKind.EnumDecl:
      return serializeEnumDecl(node) as SN
    case NodeKind.TypeAliasDecl:
      return serializeTypeAliasDecl(node) as SN
    case NodeKind.ArrayType:
      return serializeArrayType(node) as SN
    case NodeKind.ObjectType:
      return serializeObjectType(node) as SN
    case NodeKind.BooleanType:
      return serializeBooleanType(node) as SN
    case NodeKind.DateType:
      return serializeDateType(node) as SN
    case NodeKind.FloatType:
      return serializeFloatType(node) as SN
    case NodeKind.IntegerType:
      return serializeIntegerType(node) as SN
    case NodeKind.StringType:
      return serializeStringType(node) as SN
    case NodeKind.TypeArgumentType:
      return serializeTypeArgumentType(node) as SN
    case NodeKind.ReferenceIdentifierType:
      return serializeReferenceIdentifierType(node) as SN
    case NodeKind.IncludeIdentifierType:
      return serializeIncludeIdentifierType(node) as SN
    case NodeKind.NestedEntityMapType:
      return serializeNestedEntityMapType(node) as SN
    case NodeKind.EnumType:
      return serializeEnumType(node) as SN
    case NodeKind.TypeParameter:
      return serializeTypeParameter(node) as SN
    case NodeKind.ChildEntitiesType:
      return serializeChildEntitiesType(node) as SN
    default:
      return assertExhaustive(node)
  }
}

export type GetReferences<T extends Node = Node> = (
  node: T,
  value: unknown,
  inDecl: Decl[],
) => string[]

export const getReferences: GetReferences = (node, value, inDecl) => {
  switch (node.kind) {
    case NodeKind.EntityDecl:
      return getReferencesForEntityDecl(node, value, inDecl)
    case NodeKind.EnumDecl:
      return getReferencesForEnumDecl(node, value, inDecl)
    case NodeKind.TypeAliasDecl:
      return getReferencesForTypeAliasDecl(node, value, inDecl)
    case NodeKind.ArrayType:
      return getReferencesForArrayType(node, value, inDecl)
    case NodeKind.ObjectType:
      return getReferencesForObjectType(node, value, inDecl)
    case NodeKind.BooleanType:
      return getReferencesForBooleanType(node, value, inDecl)
    case NodeKind.DateType:
      return getReferencesForDateType(node, value, inDecl)
    case NodeKind.FloatType:
      return getReferencesForFloatType(node, value, inDecl)
    case NodeKind.IntegerType:
      return getReferencesForIntegerType(node, value, inDecl)
    case NodeKind.StringType:
      return getReferencesForStringType(node, value, inDecl)
    case NodeKind.TypeArgumentType:
      return getReferencesForTypeArgumentType(node, value, inDecl)
    case NodeKind.ReferenceIdentifierType:
      return getReferencesForReferenceIdentifierType(node, value, inDecl)
    case NodeKind.IncludeIdentifierType:
      return getReferencesForIncludeIdentifierType(node, value, inDecl)
    case NodeKind.NestedEntityMapType:
      return getReferencesForNestedEntityMapType(node, value, inDecl)
    case NodeKind.EnumType:
      return getReferencesForEnumType(node, value, inDecl)
    case NodeKind.TypeParameter:
      return getReferencesForTypeParameter(node, value, inDecl)
    case NodeKind.ChildEntitiesType:
      return getReferencesForChildEntitiesType(node, value, inDecl)
    default:
      return assertExhaustive(node)
  }
}
