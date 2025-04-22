import { discriminatorKey } from "../../shared/enum.js"
import { Lazy } from "../../utils/lazy.js"
import { GetReferences, Node, NodeKind, Serializer } from "../Node.js"
import {
  SerializedTypeParameter,
  serializeTypeParameter,
  TypeParameter,
} from "../parameters/TypeParameter.js"
import {
  getReferencesForType,
  resolveTypeArgumentsInType,
  SerializedType,
  serializeType,
  Type,
  validate,
} from "../types/Type.js"
import { ValidatorHelpers } from "../validation/type.js"
import {
  BaseDecl,
  GetNestedDeclarations,
  getNestedDeclarations,
  getTypeArgumentsRecord,
  SerializedBaseDecl,
  TypeArguments,
  validateDeclName,
} from "./Declaration.js"

export interface EnumDecl<
  Name extends string = string,
  T extends Record<string, Type | null> = Record<string, Type | null>,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: NodeKind["EnumDecl"]
  values: Lazy<T>
}

export interface SerializedEnumDecl<
  Name extends string = string,
  T extends Record<string, SerializedType | null> = Record<string, SerializedType | null>,
  Params extends SerializedTypeParameter[] = SerializedTypeParameter[],
> extends SerializedBaseDecl<Name, Params> {
  kind: NodeKind["EnumDecl"]
  values: T
}

export const GenEnumDecl = <
  Name extends string,
  T extends Record<string, Type | null>,
  Params extends TypeParameter[],
>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    parameters: Params
    values: (...args: Params) => T
  },
): EnumDecl<Name, T, Params> => {
  validateDeclName(options.name)

  const decl: EnumDecl<Name, T, Params> = {
    ...options,
    kind: NodeKind.EnumDecl,
    sourceUrl,
    values: Lazy.of(() => {
      const type = options.values(...options.parameters)
      Object.values(type).forEach(type => {
        if (type) {
          type.parent = decl
        }
      })
      return type
    }),
  }

  return decl
}

export { GenEnumDecl as GenEnum }

export const EnumDecl = <Name extends string, T extends Record<string, Type | null>>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    values: () => T
  },
): EnumDecl<Name, T, []> => {
  validateDeclName(options.name)

  const decl: EnumDecl<Name, T, []> = {
    ...options,
    kind: NodeKind.EnumDecl,
    sourceUrl,
    parameters: [],
    values: Lazy.of(() => {
      const type = options.values()
      Object.values(type).forEach(type => {
        if (type) {
          type.parent = decl
        }
      })
      return type
    }),
  }

  return decl
}

export { EnumDecl as Enum }

export const isEnumDecl = (node: Node): node is EnumDecl => node.kind === NodeKind.EnumDecl

export const getNestedDeclarationsInEnumDecl: GetNestedDeclarations<EnumDecl> = (
  isDeclAdded,
  decl,
) =>
  Object.values(decl.values.value).flatMap(caseDef =>
    caseDef === null ? [] : getNestedDeclarations(isDeclAdded, caseDef),
  )

export const validateEnumDecl = (
  helpers: ValidatorHelpers,
  decl: EnumDecl,
  args: Type[],
  value: unknown,
): Error[] => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [TypeError(`expected an object, but got ${JSON.stringify(value)}`)]
  }

  const actualKeys = Object.keys(value)

  if (!(discriminatorKey in value) || typeof value[discriminatorKey] !== "string") {
    return [
      TypeError(`missing required discriminator value at key "${discriminatorKey}" of type string`),
    ]
  }

  const caseName = value[discriminatorKey]

  if (!(caseName in decl.values.value)) {
    return [TypeError(`discriminator "${caseName}" is not a valid enum case`)]
  }

  const unknownKeyErrors = actualKeys.flatMap(actualKey =>
    actualKey === discriminatorKey || actualKey in decl.values.value
      ? []
      : [TypeError(`key "${actualKey}" is not the discriminator key or a valid enum case`)],
  )

  if (unknownKeyErrors.length > 0) {
    return unknownKeyErrors
  }

  const associatedType = decl.values.value[caseName]

  if (associatedType != null) {
    if (!(caseName in value)) {
      return [TypeError(`missing required associated value for case "${caseName}"`)]
    }

    return validate(
      helpers,
      resolveTypeArgumentsInType(getTypeArgumentsRecord(decl, args), associatedType),
      (value as Record<typeof caseName, unknown>)[caseName],
    )
  }

  return []
}

export const resolveTypeArgumentsInEnumDecl = <Params extends TypeParameter[]>(
  decl: EnumDecl<string, Record<string, Type | null>, Params>,
  args: TypeArguments<Params>,
): EnumDecl<string, Record<string, Type | null>, []> => {
  const resolvedArgs = getTypeArgumentsRecord(decl, args)
  return EnumDecl(decl.sourceUrl, {
    ...decl,
    values: () =>
      Object.fromEntries(
        Object.entries(decl.values.value).map(([key, value]) => [
          key,
          value === null ? null : resolveTypeArgumentsInType(resolvedArgs, value),
        ]),
      ),
  })
}

export const serializeEnumDecl: Serializer<EnumDecl, SerializedEnumDecl> = type => ({
  ...type,
  values: Object.fromEntries(
    Object.entries(type.values.value).map(([key, value]) => [
      key,
      value === null ? null : serializeType(value),
    ]),
  ),
  parameters: type.parameters.map(param => serializeTypeParameter(param)),
})

export const getReferencesForEnumDecl: GetReferences<EnumDecl> = (decl, value) =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  discriminatorKey in value &&
  typeof value[discriminatorKey] === "string" &&
  value[discriminatorKey] in decl.values.value &&
  decl.values.value[value[discriminatorKey]] !== null &&
  value[discriminatorKey] in value
    ? getReferencesForType(
        decl.values.value[value[discriminatorKey]]!,
        (value as Record<string, unknown>)[value[discriminatorKey]],
      )
    : []
