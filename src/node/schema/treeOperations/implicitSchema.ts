import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { NodeKind } from "../../../shared/schema/Node.ts"
import type { Decl } from "../dsl/declarations/Decl.ts"
import type { NestedEntityMapType, Node } from "../dsl/index.ts"

export type NestedDecl = Decl | NestedEntity

export type NestedEntity = {
  kind: "NestedEntity"
  sourceUrl: string
  name: string
  type: NestedEntityMapType
}

export const getNestedDeclarations = (
  addedDecls: NestedDecl[],
  node: Node,
  parentDecl: Decl | undefined,
): NestedDecl[] => {
  switch (node.kind) {
    case NodeKind.EntityDecl:
    case NodeKind.EnumDecl:
    case NodeKind.TypeAliasDecl:
      return addedDecls.includes(node)
        ? addedDecls
        : getNestedDeclarations([...addedDecls, node], node.type.value, node)
    case NodeKind.ArrayType:
      return getNestedDeclarations(addedDecls, node.items, parentDecl)
    case NodeKind.ObjectType:
      return Object.values(node.properties).reduce(
        (acc, prop) => getNestedDeclarations(acc, prop.type, parentDecl),
        addedDecls,
      )
    case NodeKind.ReferenceIdentifierType:
      return addedDecls.includes(node.entity)
        ? addedDecls
        : getNestedDeclarations(addedDecls, node.entity, parentDecl)
    case NodeKind.IncludeIdentifierType:
      return node.args.reduce(
        (accAddedDecls, arg) => getNestedDeclarations(accAddedDecls, arg, parentDecl),
        addedDecls.includes(node.reference)
          ? addedDecls
          : getNestedDeclarations(addedDecls, node.reference, parentDecl),
      )
    case NodeKind.NestedEntityMapType:
      return addedDecls.some(
        addedDecl => addedDecl.kind === "NestedEntity" && addedDecl.type === node,
      )
        ? addedDecls
        : [node.secondaryEntity, node.type.value].reduce(
            (accAddedDecls, partialNode) =>
              getNestedDeclarations(accAddedDecls, partialNode, parentDecl),
            [
              ...addedDecls,
              {
                kind: "NestedEntity",
                sourceUrl: parentDecl?.sourceUrl ?? "",
                name: node.name,
                type: node,
              },
            ],
          )
    case NodeKind.EnumType:
      return Object.values(node.values).reduce(
        (acc, caseMember) =>
          caseMember.type === null ? acc : getNestedDeclarations(acc, caseMember.type, parentDecl),
        addedDecls,
      )
    case NodeKind.ChildEntitiesType:
      return getNestedDeclarations(addedDecls, node.entity, parentDecl)
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.TypeArgumentType:
    case NodeKind.TypeParameter:
    case NodeKind.TranslationObjectType:
      return addedDecls
    default:
      return assertExhaustive(node)
  }
}
