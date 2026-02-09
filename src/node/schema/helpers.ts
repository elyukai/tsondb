import { error, ok } from "@elyukai/utils/result"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { NodeKind } from "../../shared/schema/Node.ts"
import { getAtKeyPath, parseKeyPath, type KeyPath } from "../../shared/schema/utils/keyPath.ts"
import {
  type Decl,
  type EntityDecl,
  type EnumDecl,
  type Node,
  type Type,
  type TypeAliasDecl,
} from "./dsl/index.ts"
import type { TypeParameter } from "./dsl/TypeParameter.ts"
import type { ArrayType } from "./dsl/types/ArrayType.ts"
import type { BooleanType } from "./dsl/types/BooleanType.ts"
import { type ChildEntitiesType } from "./dsl/types/ChildEntitiesType.ts"
import type { DateType } from "./dsl/types/DateType.ts"
import type { EnumCaseDecl, EnumType } from "./dsl/types/EnumType.ts"
import type { FloatType } from "./dsl/types/FloatType.ts"
import type { IncludeIdentifierType } from "./dsl/types/IncludeIdentifierType.ts"
import type { IntegerType } from "./dsl/types/IntegerType.ts"
import type { NestedEntityMapType } from "./dsl/types/NestedEntityMapType.ts"
import type { MemberDecl, ObjectType } from "./dsl/types/ObjectType.ts"
import type { ReferenceIdentifierType } from "./dsl/types/ReferenceIdentifierType.ts"
import type { StringType } from "./dsl/types/StringType.ts"
import { type TranslationObjectType } from "./dsl/types/TranslationObjectType.ts"
import type { TypeArgumentType } from "./dsl/types/TypeArgumentType.ts"
import {
  isArrayType,
  isDecl,
  isIncludeIdentifierType,
  isObjectType,
  isTypeAliasDecl,
} from "./guards.ts"

type KindToTypeMap = {
  ChildEntityDecl: ChildEntitiesType
  EntityDecl: EntityDecl
  EnumDecl: EnumDecl
  TypeAliasDecl: TypeAliasDecl
  ArrayType: ArrayType
  ObjectType: ObjectType
  BooleanType: BooleanType
  FloatType: FloatType
  IntegerType: IntegerType
  StringType: StringType
  DateType: DateType
  TypeArgumentType: TypeArgumentType
  ReferenceIdentifierType: ReferenceIdentifierType
  IncludeIdentifierType: IncludeIdentifierType
  NestedEntityMapType: NestedEntityMapType
  EnumType: EnumType
  ChildEntitiesType: ChildEntitiesType
  TranslationObjectType: TranslationObjectType
}

export const isOfKind = <K extends keyof KindToTypeMap>(
  node: Node,
  kind: K,
): node is KindToTypeMap[K] => node.kind === kind

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
      case NodeKind.TranslationObjectType:
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

export type Predicate<T extends Node> = (node: Node) => node is T

export function walkTypeNodeTree(
  callbackFn: (type: Type, parentTypes: Type[], parentDecl: Decl) => void,
  type: Type,
  parentTypes: Type[],
  parentDecl: Decl,
): void {
  switch (type.kind) {
    case NodeKind.ArrayType: {
      callbackFn(type, parentTypes, parentDecl)
      walkTypeNodeTree(callbackFn, type.items, [...parentTypes, type], parentDecl)
      return
    }
    case NodeKind.ObjectType: {
      callbackFn(type, parentTypes, parentDecl)
      Object.values(type.properties).forEach(prop => {
        walkTypeNodeTree(callbackFn, prop.type, [...parentTypes, type], parentDecl)
      })
      return
    }
    case NodeKind.NestedEntityMapType: {
      callbackFn(type, parentTypes, parentDecl)
      walkTypeNodeTree(callbackFn, type.type.value, [...parentTypes, type], parentDecl)
      return
    }
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.TypeArgumentType:
    case NodeKind.ReferenceIdentifierType:
    case NodeKind.ChildEntitiesType:
    case NodeKind.TranslationObjectType: {
      callbackFn(type, parentTypes, parentDecl)
      return
    }
    case NodeKind.IncludeIdentifierType: {
      callbackFn(type, parentTypes, parentDecl)
      type.args.forEach(arg => {
        walkTypeNodeTree(callbackFn, arg, [...parentTypes, type], parentDecl)
      })
      return
    }
    case NodeKind.EnumType: {
      callbackFn(type, parentTypes, parentDecl)
      Object.values(type.values).forEach(value => {
        if (value.type) {
          walkTypeNodeTree(callbackFn, value.type, [...parentTypes, type], parentDecl)
        }
      })
      return
    }
    default:
      return assertExhaustive(type)
  }
}

type EnumCaseTypeAsType<Case extends string, T extends Type | null> = T extends object
  ? { kind: Case } & { [AV in Case]: AsType<T> }
  : { kind: Case }

type EnumCaseTypeAsDeepType<Case extends string, T extends Type | null> = T extends object
  ? { kind: Case } & { [AV in Case]: AsDeepType<T> }
  : { kind: Case }

type MemberDeclsAsType<P extends Record<string, MemberDecl>> = {
  [K in keyof P]: P[K] extends MemberDecl<Type, true>
    ? AsType<P[K]["type"]>
    : AsType<P[K]["type"]> | undefined
}

type MemberDeclsAsDeepType<P extends Record<string, MemberDecl>> = {
  [K in keyof P]: P[K] extends MemberDecl<Type, true>
    ? AsDeepType<P[K]["type"]>
    : AsDeepType<P[K]["type"]> | undefined
}

export type AsDeepType<T extends Type> =
  T extends ArrayType<infer I>
    ? AsDeepType<I>[]
    : T extends ObjectType<infer P>
      ? MemberDeclsAsDeepType<P>
      : T extends BooleanType
        ? boolean
        : T extends DateType
          ? Date
          : T extends FloatType
            ? number
            : T extends IntegerType
              ? number
              : T extends StringType
                ? string
                : T extends TypeArgumentType
                  ? unknown
                  : T extends IncludeIdentifierType<TypeParameter[], infer Decl>
                    ? Decl extends TypeAliasDecl<string, infer TA>
                      ? AsDeepType<TA>
                      : Decl extends EnumDecl<string, infer EC>
                        ? AsDeepType<EnumType<EC>>
                        : unknown
                    : T extends NestedEntityMapType<string, infer TC>
                      ? { [id: string]: MemberDeclsAsDeepType<TC> }
                      : T extends ReferenceIdentifierType
                        ? string
                        : T extends ChildEntitiesType
                          ? never
                          : T extends EnumType<infer EC>
                            ? EC extends Record<string, EnumCaseDecl>
                              ? {
                                  [Case in keyof EC]: EnumCaseTypeAsDeepType<
                                    Case & string,
                                    EC[Case]["type"]
                                  >
                                }[keyof EC]
                              : never
                            : never

export type AsType<T extends Type> =
  T extends ArrayType<infer I>
    ? AsType<I>[]
    : T extends ObjectType<infer P>
      ? MemberDeclsAsType<P>
      : T extends BooleanType
        ? boolean
        : T extends DateType
          ? Date
          : T extends FloatType
            ? number
            : T extends IntegerType
              ? number
              : T extends StringType
                ? string
                : T extends TypeArgumentType
                  ? unknown
                  : T extends IncludeIdentifierType
                    ? unknown
                    : T extends NestedEntityMapType<string, infer TC>
                      ? { [id: string]: MemberDeclsAsType<TC> }
                      : T extends ReferenceIdentifierType
                        ? string
                        : T extends ChildEntitiesType
                          ? string[]
                          : T extends EnumType<infer EC>
                            ? EC extends Record<string, EnumCaseDecl>
                              ? {
                                  [Case in keyof EC]: EnumCaseTypeAsType<
                                    Case & string,
                                    EC[Case]["type"]
                                  >
                                }[keyof EC]
                              : never
                            : never

export type AsNode<T> = T extends (infer I)[]
  ? ArrayType<AsNode<I>>
  : T extends Record<string, unknown>
    ? ObjectType<{
        [K in keyof T]: T[K] extends MemberDecl
          ? T[K]
          : T extends null | undefined
            ? MemberDecl<AsNode<NonNullable<T[K]>>, false>
            : MemberDecl<AsNode<T[K]>, true>
      }>
    : T extends string
      ? StringType
      : T extends number
        ? FloatType
        : T extends boolean
          ? BooleanType
          : T extends Date
            ? DateType
            : never

export const findTypeAtPath = (
  type: Type,
  path: KeyPath,
  options: { followTypeAliasIncludes?: boolean; throwOnPathMismatch?: boolean } = {},
): Type =>
  getAtKeyPath<Type>(
    type,
    [],
    parseKeyPath(path),
    options.throwOnPathMismatch ?? false,
    type =>
      isArrayType(type)
        ? ok(type.items)
        : error(previousPath => `Key path "${previousPath}" does not contain an array type.`),
    (type, name) => {
      if (isObjectType(type)) {
        const prop = type.properties[name]
        if (prop) {
          return ok(prop.type)
        } else {
          return error(
            previousPath =>
              `Object type at key path "${previousPath}" does not contain the property ${name}.`,
          )
        }
      } else {
        return error(previousPath => `Key path "${previousPath}" does not contain an object type.`)
      }
    },
    // recursively resolves type aliases in includes as this is automatically
    // called recursively if needed
    type =>
      isIncludeIdentifierType(type) &&
      options.followTypeAliasIncludes &&
      isTypeAliasDecl(type.reference)
        ? ok([type.reference.type.value, true])
        : error(),
  )

/**
 * Tests whether a type is a child entity type, either directly or through an include.
 */
export const isFinalChildEntitiesType = (type: Type): boolean =>
  type.kind === NodeKind.ChildEntitiesType
    ? true
    : type.kind === NodeKind.IncludeIdentifierType
      ? isFinalChildEntitiesType(type.reference.type.value)
      : false
