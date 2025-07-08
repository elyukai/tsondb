import { enumOfObject } from "../../shared/utils/enum.js"
import { InstancesByEntityName } from "../../shared/utils/instances.js"
import { assertExhaustive } from "../../shared/utils/typeSafety.js"
import { Decl } from "./declarations/Declaration.js"
import { Type } from "./types/Type.js"

export interface NodeKind {
  EntityDecl: "EntityDecl"
  EnumDecl: "EnumDecl"
  EnumCaseDecl: "EnumCaseDecl"
  TypeAliasDecl: "TypeAliasDecl"
  MemberDecl: "MemberDecl"
  ArrayType: "ArrayType"
  ObjectType: "ObjectType"
  BooleanType: "BooleanType"
  FloatType: "FloatType"
  IntegerType: "IntegerType"
  StringType: "StringType"
  DateType: "DateType"
  TypeArgumentType: "TypeArgumentType"
  GenericParameter: "GenericParameter"
  ReferenceIdentifierType: "ReferenceIdentifierType"
  IncludeIdentifierType: "IncludeIdentifierType"
  NestedEntityMapType: "NestedEntityMapType"
  EnumType: "EnumType"
}

export const NodeKind: NodeKind = enumOfObject({
  EntityDecl: null,
  EnumDecl: null,
  EnumCaseDecl: null,
  TypeAliasDecl: null,
  MemberDecl: null,
  ArrayType: null,
  ObjectType: null,
  BooleanType: null,
  FloatType: null,
  IntegerType: null,
  StringType: null,
  DateType: null,
  TypeArgumentType: null,
  GenericParameter: null,
  ReferenceIdentifierType: null,
  IncludeIdentifierType: null,
  NestedEntityMapType: null,
  EnumType: null,
})

export interface BaseNode {
  kind: (typeof NodeKind)[keyof typeof NodeKind]
}

export type Node = Decl | Type

export const flatMapAuxiliaryDecls = (
  callbackFn: (node: Node) => (Decl | undefined)[] | Decl | undefined,
  declarations: readonly Decl[],
): Decl[] => {
  const mapNodeTree = (
    callbackFn: (node: Node, decls: Decl[]) => Decl[],
    node: Node,
    decls: Decl[],
  ): Decl[] => {
    switch (node.kind) {
      case NodeKind.EntityDecl: {
        const newDecls = callbackFn(node, decls)
        return mapNodeTree(callbackFn, node.type.value, newDecls)
      }

      case NodeKind.EnumDecl: {
        const newDecls = callbackFn(node, decls)
        return mapNodeTree(callbackFn, node.type.value, newDecls)
      }

      case NodeKind.TypeAliasDecl: {
        const newDecls = callbackFn(node, decls)
        return mapNodeTree(callbackFn, node.type.value, newDecls)
      }

      case NodeKind.ArrayType: {
        const newDecls = callbackFn(node, decls)
        return mapNodeTree(callbackFn, node.items, newDecls)
      }

      case NodeKind.ObjectType: {
        const newDecls = callbackFn(node, decls)
        return Object.values(node.properties).reduce(
          (newDeclsAcc, prop) => mapNodeTree(callbackFn, prop.type, newDeclsAcc),
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
        return callbackFn(node, decls)

      case NodeKind.EnumType: {
        const newDecls = callbackFn(node, decls)
        return Object.values(node.values).reduce(
          (newDeclsAcc, caseDef) =>
            caseDef.type === null ? newDecls : mapNodeTree(callbackFn, caseDef.type, newDeclsAcc),
          newDecls,
        )
      }

      default:
        return assertExhaustive(node)
    }
  }

  const reducer = (node: Node, decls: Decl[]): Decl[] => {
    const result = callbackFn(node)
    const normalizedResult = (Array.isArray(result) ? result : [result]).filter(
      decl => decl !== undefined,
    )
    normalizedResult.forEach(decl => {
      if (decls.some(existingDecl => existingDecl.name === decl.name)) {
        throw new Error(
          `Duplicate declaration name: "${decl.name}". Make sure declaration names are globally unique.`,
        )
      }
    })
    return decls.concat(normalizedResult)
  }

  return declarations.reduce(
    (decls: Decl[], node) => mapNodeTree(reducer, node, [...decls, node]),
    [],
  )
}

export type IdentifierToCheck = { name: string; value: unknown }

export interface Validators {
  checkReferentialIntegrity: (identifier: IdentifierToCheck) => Error[]
}

export const createValidators = (instancesByEntityName: InstancesByEntityName): Validators => ({
  checkReferentialIntegrity: ({ name, value }) =>
    instancesByEntityName[name]!.some(
      instance =>
        typeof instance.content === "object" &&
        instance.content !== null &&
        !Array.isArray(instance.content) &&
        instance.id === value,
    )
      ? []
      : [
          ReferenceError(
            `Invalid reference to instance of entity "${name}" with identifier ${JSON.stringify(
              value,
            )}`,
          ),
        ],
})

export type Serializer<T, U> = (node: T) => U

export type GetReferences<T extends Node> = (node: T, value: unknown) => string[]
