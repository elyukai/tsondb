import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { ENUM_DISCRIMINATOR_KEY } from "../../../shared/schema/declarations/EnumDecl.ts"
import { NodeKind } from "../../../shared/schema/Node.ts"
import { wrapThrownError } from "../../../shared/utils/error.ts"
import type { InstanceContent } from "../../../shared/utils/instances.ts"
import type { CustomConstraintHelpers } from "../../utils/customConstraints.ts"
import type { SecondaryDecl } from "../dsl/declarations/Decl.ts"
import type { EntityDecl } from "../dsl/declarations/EntityDecl.ts"
import type { SingletonEntityDecl, Type } from "../dsl/index.ts"
import { resolveNestedTypeArguments } from "./format.ts"

export const checkCustomConstraintsInEntityDecl = (
  node: EntityDecl,
  value: [id: string, content: InstanceContent],
  helpers: CustomConstraintHelpers,
): string[] =>
  wrapThrownError(
    () =>
      (
        node.customConstraints?.({ ...helpers, instanceId: value[0], instanceContent: value[1] }) ??
        []
      ).concat(checkNestedCustomConstraints(node.type.value, value, helpers)),
    `in entity "${node.name}" with id "${value[0]}"`,
  )

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
  typeArgs: Record<string, Type> = {},
): string[] => {
  switch (node.kind) {
    case NodeKind.EnumDecl:
      return wrapThrownError(
        () =>
          (node.customConstraints?.({ ...helpers, value }) ?? []).concat(
            checkNestedCustomConstraints(node.type.value, value, helpers, typeArgs),
          ),
        `in enum "${node.name}"`,
      )
    case NodeKind.TypeAliasDecl:
      return wrapThrownError(
        () =>
          (node.customConstraints?.({ ...helpers, value }) ?? []).concat(
            checkNestedCustomConstraints(node.type.value, value, helpers, typeArgs),
          ),
        `in type alias "${node.name}"`,
      )
    case NodeKind.ArrayType:
      return Array.isArray(value)
        ? value.flatMap((item, index) =>
            wrapThrownError(
              () => checkNestedCustomConstraints(node.items, item, helpers, typeArgs),
              `in array at index "${index}"`,
            ),
          )
        : []
    case NodeKind.ObjectType:
      return typeof value === "object" && value !== null
        ? Object.entries(value).flatMap(([key, propValue]) =>
            node.properties[key]
              ? wrapThrownError(
                  () =>
                    checkNestedCustomConstraints(
                      node.properties[key]!.type,
                      propValue,
                      helpers,
                      typeArgs,
                    ),
                  `in object property "${key}"`,
                )
              : [],
          )
        : []
    case NodeKind.TypeArgumentType: {
      const typeArgument = typeArgs[node.argument.name]
      if (typeArgument === undefined) {
        throw new Error(`Type argument "${node.argument.name}" could not be resolved.`)
      } else {
        return checkNestedCustomConstraints(typeArgument, value, helpers, typeArgs)
      }
    }
    case NodeKind.IncludeIdentifierType:
      return checkNestedCustomConstraints(
        node.reference,
        value,
        helpers,
        Object.fromEntries(
          node.args.map((arg, index) => [
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            node.reference.parameters[index]!.name,
            resolveNestedTypeArguments(arg, typeArgs),
          ]),
        ),
      )
    case NodeKind.NestedEntityMapType:
      return checkNestedCustomConstraints(node.type.value, value, helpers, typeArgs)
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
        ? wrapThrownError(
            () =>
              checkNestedCustomConstraints(
                node.values[enumCase]!.type!,
                (value as Record<string, unknown>)[enumCase],
                helpers,
                typeArgs,
              ),
            `in enum case "${enumCase}"`,
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
