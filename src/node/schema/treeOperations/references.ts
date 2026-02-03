import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { ENUM_DISCRIMINATOR_KEY } from "../../../shared/schema/declarations/EnumDecl.ts"
import { NodeKind } from "../../../shared/schema/Node.ts"
import { getTypeArgumentsRecord, type Decl } from "../dsl/declarations/Decl.ts"
import type { Node } from "../dsl/index.ts"
import { resolveTypeArguments } from "./typeResolution.ts"

export const getReferences = (node: Node, value: unknown, inDecl: Decl[]): string[] => {
  switch (node.kind) {
    case NodeKind.EntityDecl:
    case NodeKind.EnumDecl:
    case NodeKind.TypeAliasDecl:
      return getReferences(node.type.value, value, [...inDecl, node])
    case NodeKind.ArrayType:
      return Array.isArray(value)
        ? value.flatMap(item => getReferences(node.items, item, inDecl))
        : []
    case NodeKind.ObjectType:
      return typeof value === "object" && value !== null
        ? Object.entries(value).flatMap(([key, propValue]) =>
            node.properties[key] ? getReferences(node.properties[key].type, propValue, inDecl) : [],
          )
        : []
    case NodeKind.ReferenceIdentifierType:
      return typeof value === "string" ? [value] : []
    case NodeKind.IncludeIdentifierType:
      return getReferences(
        resolveTypeArguments(
          getTypeArgumentsRecord(node.reference, node.args),
          node.reference,
          inDecl,
        ),
        value,
        inDecl,
      )
    case NodeKind.NestedEntityMapType:
      return typeof value === "object" && value !== null && !Array.isArray(value)
        ? Object.values(value)
            .flatMap(item => getReferences(node.type.value, item, inDecl))
            .concat(Object.keys(value))
        : []
    case NodeKind.EnumType: {
      if (
        typeof value !== "object" ||
        value === null ||
        Array.isArray(value) ||
        !(ENUM_DISCRIMINATOR_KEY in value)
      ) {
        return []
      }

      const enumCase = value[ENUM_DISCRIMINATOR_KEY]

      return typeof enumCase === "string" &&
        enumCase in node.values &&
        node.values[enumCase] !== undefined &&
        node.values[enumCase].type !== null &&
        enumCase in value
        ? getReferences(
            node.values[enumCase].type,
            (value as Record<string, unknown>)[enumCase],
            inDecl,
          )
        : []
    }
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.TypeArgumentType:
    case NodeKind.TypeParameter:
    case NodeKind.ChildEntitiesType:
    case NodeKind.TranslationObjectType:
      return []
    default:
      return assertExhaustive(node)
  }
}
