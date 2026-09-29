import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { ENUM_DISCRIMINATOR_KEY } from "../../../shared/schema/declarations/EnumDecl.ts"
import { NodeKind } from "../../../shared/schema/Node.ts"
import type { InstanceContent } from "../../../shared/utils/instances.ts"
import type { CustomConstraintHelpers } from "../../utils/customConstraints.ts"
import type { SecondaryDecl } from "../dsl/declarations/Decl.ts"
import type { EntityDecl } from "../dsl/declarations/EntityDecl.ts"
import type { SingletonEntityDecl, Type } from "../dsl/index.ts"

export const checkCustomConstraintsInEntityDecl = (
  node: EntityDecl,
  value: [id: string, content: InstanceContent],
  helpers: CustomConstraintHelpers,
): string[] =>
  (
    node.customConstraints?.({ ...helpers, instanceId: value[0], instanceContent: value[1] }) ?? []
  ).concat(checkNestedCustomConstraints(node.type.value, value, helpers))

export const checkCustomConstraintsInSingletonEntityDecl = (
  node: SingletonEntityDecl,
  value: InstanceContent,
  helpers: CustomConstraintHelpers,
): string[] =>
  (
    node.customConstraints?.({ ...helpers, instanceId: node.name, instanceContent: value }) ?? []
  ).concat(checkNestedCustomConstraints(node.type.value, value, helpers))

const checkNestedCustomConstraints = (
  node: Type | SecondaryDecl,
  value: unknown,
  helpers: CustomConstraintHelpers,
): string[] => {
  switch (node.kind) {
    case NodeKind.EnumDecl:
      return (node.customConstraints?.({ ...helpers, value }) ?? []).concat(
        checkNestedCustomConstraints(node.type.value, value, helpers),
      )
    case NodeKind.TypeAliasDecl:
      return (node.customConstraints?.({ ...helpers, value }) ?? []).concat(
        checkNestedCustomConstraints(node.type.value, value, helpers),
      )
    case NodeKind.ArrayType:
      return Array.isArray(value)
        ? value.flatMap(item => checkNestedCustomConstraints(node.items, item, helpers))
        : []
    case NodeKind.ObjectType:
      return typeof value === "object" && value !== null
        ? Object.entries(value).flatMap(([key, propValue]) =>
            node.properties[key]
              ? checkNestedCustomConstraints(node.properties[key].type, propValue, helpers)
              : [],
          )
        : []
    case NodeKind.TypeArgumentType: {
      throw new TypeError(
        `type argument "${node.argument.name}" is unresolved. Make sure to resolve all type arguments before checking for nested custom constraints.`,
      )
    }
    case NodeKind.IncludeIdentifierType:
      return checkNestedCustomConstraints(node.reference, value, helpers)
    case NodeKind.NestedEntityMapType:
      return checkNestedCustomConstraints(node.type.value, value, helpers)
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
        ? checkNestedCustomConstraints(
            node.values[enumCase].type,
            (value as Record<string, unknown>)[enumCase],
            helpers,
          )
        : []
    }
    case NodeKind.BooleanType:
    case NodeKind.DateType:
    case NodeKind.FloatType:
    case NodeKind.IntegerType:
    case NodeKind.StringType:
    case NodeKind.ReferenceIdentifierType:
    case NodeKind.ChildEntitiesType:
    case NodeKind.TranslationObjectType:
      return []
    default:
      return assertExhaustive(node)
  }
}
