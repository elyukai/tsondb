import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { NodeKind } from "../../../shared/schema/Node.ts"
import type { TypedNestedCustomConstraint } from "../../utils/customConstraints.ts"
import {
  getTypeArgumentsRecord,
  isDeclWithoutTypeParameters,
  type Decl,
  type IncludableDeclP,
} from "../dsl/declarations/Decl.ts"
import { EntityDecl } from "../dsl/declarations/EntityDecl.ts"
import { EnumDecl } from "../dsl/declarations/EnumDecl.ts"
import { isTypeAliasDecl, TypeAliasDecl } from "../dsl/declarations/TypeAliasDecl.ts"
import type { Node, Type } from "../dsl/index.ts"
import type { TypeParameter } from "../dsl/TypeParameter.ts"
import { ArrayType } from "../dsl/types/ArrayType.ts"
import { type BooleanType } from "../dsl/types/BooleanType.ts"
import { type ChildEntitiesType } from "../dsl/types/ChildEntitiesType.ts"
import { type DateType } from "../dsl/types/DateType.ts"
import type { EnumCaseDecl } from "../dsl/types/EnumType.ts"
import { EnumType } from "../dsl/types/EnumType.ts"
import { type FloatType } from "../dsl/types/FloatType.ts"
import {
  IncludeIdentifierType,
  isIncludeIdentifierType,
  isNoGenericIncludeIdentifierType,
} from "../dsl/types/IncludeIdentifierType.ts"
import { type IntegerType } from "../dsl/types/IntegerType.ts"
import { _NestedEntityMapType, type NestedEntityMapType } from "../dsl/types/NestedEntityMapType.ts"
import type { MemberDecl } from "../dsl/types/ObjectType.ts"
import { ObjectType } from "../dsl/types/ObjectType.ts"
import { type ReferenceIdentifierType } from "../dsl/types/ReferenceIdentifierType.ts"
import { type StringType } from "../dsl/types/StringType.ts"
import type { TranslationObjectType } from "../dsl/types/TranslationObjectType.ts"
import { isTypeArgumentType, type TypeArgumentType } from "../dsl/types/TypeArgumentType.ts"

export type NodeWithResolvedTypeArguments<T extends Node | null> = T extends
  | BooleanType
  | DateType
  | FloatType
  | IntegerType
  | StringType
  | ReferenceIdentifierType
  | ChildEntitiesType
  | TranslationObjectType
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
                        : T extends null
                          ? null
                          : never

export const resolveTypeArguments = <T extends Node = Node>(
  args: Record<string, Type>,
  node: T,
  inDecl: Decl[],
): NodeWithResolvedTypeArguments<T> => {
  type RN = NodeWithResolvedTypeArguments<T>
  switch (node.kind) {
    case NodeKind.EntityDecl:
      return EntityDecl(node.sourceUrl, {
        ...node,
        type: () => resolveTypeArguments({}, node.type.value, [...inDecl, node]),
      }) as RN
    case NodeKind.EnumDecl:
      return EnumDecl(node.sourceUrl, {
        name: node.name,
        comment: node.comment,
        isDeprecated: node.isDeprecated,
        values: () => resolveTypeArguments(args, node.type.value, [...inDecl, node]).values,
      }) as RN
    case NodeKind.TypeAliasDecl:
      return TypeAliasDecl(node.sourceUrl, {
        ...node,
        type: () => resolveTypeArguments(args, node.type.value, [...inDecl, node]),
        customConstraints: node.customConstraints as
          | TypedNestedCustomConstraint<string>
          | undefined, // ignore contravariance of registered type alias type
      }) as RN
    case NodeKind.ArrayType:
      return ArrayType(resolveTypeArguments(args, node.items, inDecl), {
        ...node,
      }) as RN
    case NodeKind.ObjectType:
      return ObjectType(
        Object.fromEntries(
          Object.entries(node.properties).map(
            ([key, config]) =>
              [key, { ...config, type: resolveTypeArguments(args, config.type, inDecl) }] as const,
          ),
        ),
        {
          ...node,
        },
      ) as RN
    case NodeKind.TypeArgumentType: {
      if (!(node.argument.name in args)) {
        throw new TypeError(`no generic argument provided for "${node.argument.name}"`)
      }

      return args[node.argument.name] as RN
    }
    case NodeKind.IncludeIdentifierType: {
      if (isNoGenericIncludeIdentifierType(node)) {
        return node as RN
      } else {
        const parentDecl = inDecl[inDecl.length - 1]
        const grandParentDecl = inDecl[inDecl.length - 2]

        if (
          node.reference === parentDecl &&
          parentDecl.parameters.length > 0 &&
          grandParentDecl &&
          isDeclWithoutTypeParameters(grandParentDecl) &&
          isTypeAliasDecl(grandParentDecl) &&
          node.args.every(
            (arg, argIndex) =>
              isTypeArgumentType(arg) && parentDecl.parameters[argIndex] === arg.argument,
          )
        ) {
          const grandParentDeclType = grandParentDecl.type.value

          if (
            isIncludeIdentifierType(grandParentDeclType) &&
            grandParentDeclType.reference === node.reference
          ) {
            return IncludeIdentifierType(grandParentDecl) as RN
          }
        }

        return resolveTypeArguments(
          getTypeArgumentsRecord(
            node.reference,
            node.args.map(arg => resolveTypeArguments(args, arg, inDecl)),
          ),
          node.reference,
          inDecl,
        ).type.value as RN
      }
    }
    case NodeKind.NestedEntityMapType:
      return _NestedEntityMapType({
        ...node,
        type: () => resolveTypeArguments(args, node.type.value, inDecl),
      }) as RN
    case NodeKind.EnumType:
      return EnumType(
        Object.fromEntries(
          Object.entries(node.values).map(([key, { type, ...caseMember }]) => [
            key,
            {
              ...caseMember,
              type: type === null ? null : resolveTypeArguments(args, type, inDecl),
            },
          ]),
        ),
      ) as RN
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.ReferenceIdentifierType:
    case NodeKind.TypeParameter:
    case NodeKind.ChildEntitiesType:
    case NodeKind.TranslationObjectType: {
      return node as RN
    }
    default:
      return assertExhaustive(node)
  }
}
