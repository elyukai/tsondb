import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  SerializedEntityDecl,
  SerializedEntityDisplayName,
} from "../../../shared/schema/declarations/EntityDecl.ts"
import type { SerializedEnumDecl } from "../../../shared/schema/declarations/EnumDecl.ts"
import type { SerializedTypeAliasDecl } from "../../../shared/schema/declarations/TypeAliasDecl.ts"
import { NodeKind } from "../../../shared/schema/Node.js"
import type { SerializedTypeParameter } from "../../../shared/schema/TypeParameter.ts"
import type { SerializedArrayType } from "../../../shared/schema/types/ArrayType.ts"
import type { SerializedBooleanType } from "../../../shared/schema/types/BooleanType.ts"
import type { SerializedChildEntitiesType } from "../../../shared/schema/types/ChildEntitiesType.ts"
import type { SerializedDateType } from "../../../shared/schema/types/DateType.ts"
import type {
  SerializedEnumCaseDecl,
  SerializedEnumType,
} from "../../../shared/schema/types/EnumType.ts"
import type { SerializedFloatType } from "../../../shared/schema/types/FloatType.ts"
import type { SerializedIncludeIdentifierType } from "../../../shared/schema/types/IncludeIdentifierType.ts"
import type { SerializedIntegerType } from "../../../shared/schema/types/IntegerType.ts"
import type { SerializedNestedEntityMapType } from "../../../shared/schema/types/NestedEntityMapType.ts"
import type {
  SerializedMemberDecl,
  SerializedObjectType,
} from "../../../shared/schema/types/ObjectType.ts"
import type { SerializedReferenceIdentifierType } from "../../../shared/schema/types/ReferenceIdentifierType.ts"
import type { SerializedStringType } from "../../../shared/schema/types/StringType.ts"
import type { SerializedTranslationObjectType } from "../../../shared/schema/types/TranslationObjectType.ts"
import type { SerializedTypeArgumentType } from "../../../shared/schema/types/TypeArgumentType.ts"
import { type EntityDecl } from "../dsl/declarations/EntityDecl.ts"
import { type EnumDecl } from "../dsl/declarations/EnumDecl.ts"
import { type TypeAliasDecl } from "../dsl/declarations/TypeAliasDecl.ts"
import type { Node, Type } from "../dsl/index.ts"
import { type TypeParameter } from "../dsl/TypeParameter.ts"
import { type ArrayType } from "../dsl/types/ArrayType.ts"
import { type BooleanType } from "../dsl/types/BooleanType.ts"
import { type ChildEntitiesType } from "../dsl/types/ChildEntitiesType.ts"
import { type DateType } from "../dsl/types/DateType.ts"
import { type EnumCaseDecl, type EnumType } from "../dsl/types/EnumType.ts"
import { type FloatType } from "../dsl/types/FloatType.ts"
import { type IncludeIdentifierType } from "../dsl/types/IncludeIdentifierType.ts"
import { type IntegerType } from "../dsl/types/IntegerType.ts"
import { type NestedEntityMapType } from "../dsl/types/NestedEntityMapType.ts"
import { type MemberDecl, type ObjectType } from "../dsl/types/ObjectType.ts"
import { type ReferenceIdentifierType } from "../dsl/types/ReferenceIdentifierType.ts"
import { type StringType } from "../dsl/types/StringType.ts"
import { type TranslationObjectType } from "../dsl/types/TranslationObjectType.ts"
import { type TypeArgumentType } from "../dsl/types/TypeArgumentType.ts"

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
  [NodeKind.TranslationObjectType]: [TranslationObjectType, SerializedTranslationObjectType]
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
  T extends TranslationObjectType<infer E> ? SerializedTranslationObjectType<E> :
  never

export type SerializedOf<T extends Node> = SerializedNodeMap[T["kind"]][1]

export type Serializer<T extends Node = Node> = (node: T) => Serialized<T>

export const serializeNode = <T extends Node>(node: T): Serialized<T> => {
  type SN = Serialized<T>
  switch (node.kind) {
    case NodeKind.EntityDecl: {
      const serializedNode: SerializedEntityDecl = {
        ...node,
        type: serializeNode(node.type.value),
        instanceDisplayName: node.instanceDisplayName as SerializedEntityDisplayName<
          Record<string, SerializedMemberDecl>
        >,
        instanceDisplayNameCustomizer: node.instanceDisplayNameCustomizer !== undefined,
        customConstraints: node.customConstraints !== undefined,
      }
      return serializedNode as SN
    }
    case NodeKind.EnumDecl: {
      const serializedNode: SerializedEnumDecl = {
        ...node,
        type: serializeNode(node.type.value),
        parameters: node.parameters.map(param => serializeNode(param)),
        customConstraints: node.customConstraints !== undefined,
      }
      return serializedNode as SN
    }
    case NodeKind.TypeAliasDecl: {
      const serializedNode: SerializedTypeAliasDecl = {
        ...node,
        type: serializeNode(node.type.value),
        parameters: node.parameters.map(param => serializeNode(param)),
        customConstraints: node.customConstraints !== undefined,
      }
      return serializedNode as SN
    }
    case NodeKind.ArrayType: {
      const serializedNode: SerializedArrayType = {
        ...node,
        items: serializeNode(node.items),
      }
      return serializedNode as SN
    }
    case NodeKind.ObjectType: {
      const serializedNode: SerializedObjectType = {
        ...node,
        properties: Object.fromEntries(
          Object.entries(node.properties).map(([key, prop]): [string, SerializedMemberDecl] => [
            key,
            {
              ...prop,
              type: serializeNode(prop.type),
            },
          ]),
        ),
      }
      return serializedNode as SN
    }
    case NodeKind.StringType: {
      const serializedNode: SerializedStringType = {
        ...node,
        pattern: node.pattern?.source,
      }
      return serializedNode as SN
    }
    case NodeKind.TypeArgumentType: {
      const serializedNode: SerializedTypeArgumentType = {
        ...node,
        argument: serializeNode(node.argument),
      }
      return serializedNode as SN
    }
    case NodeKind.ReferenceIdentifierType: {
      const serializedNode: SerializedReferenceIdentifierType = {
        ...node,
        entity: node.entity.name,
      }
      return serializedNode as SN
    }
    case NodeKind.IncludeIdentifierType: {
      const serializedNode: SerializedIncludeIdentifierType = {
        ...node,
        reference: node.reference.name,
        args: node.args.map(arg => serializeNode(arg)),
      }
      return serializedNode as SN
    }
    case NodeKind.NestedEntityMapType: {
      const serializedNode: SerializedNestedEntityMapType = {
        ...node,
        secondaryEntity: node.secondaryEntity.name,
        type: serializeNode(node.type.value),
      }
      return serializedNode as SN
    }
    case NodeKind.EnumType: {
      const serializedNode: SerializedEnumType = {
        ...node,
        values: Object.fromEntries(
          Object.entries(node.values).map(([key, caseMember]) => [
            key,
            {
              ...caseMember,
              type: caseMember.type === null ? null : serializeNode(caseMember.type),
            },
          ]),
        ),
      }
      return serializedNode as SN
    }
    case NodeKind.TypeParameter: {
      const serializedNode: SerializedTypeParameter = {
        ...node,
        constraint: node.constraint ? serializeNode(node.constraint) : undefined,
      }
      return serializedNode as SN
    }
    case NodeKind.ChildEntitiesType: {
      const serializedNode: SerializedChildEntitiesType = { ...node, entity: node.entity.name }
      return serializedNode as SN
    }
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.TranslationObjectType: {
      const serializedNode:
        | SerializedBooleanType
        | SerializedDateType
        | SerializedFloatType
        | SerializedIntegerType
        | SerializedTranslationObjectType = { ...node }
      return serializedNode as SN
    }
    default:
      return assertExhaustive(node)
  }
}
