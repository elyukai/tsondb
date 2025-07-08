import { Lazy } from "../../utils/lazy.js"
import { GetReferences, Node, NodeKind, Serializer } from "../Node.js"
import { SerializedTypeParameter, serializeTypeParameter, TypeParameter } from "../TypeParameter.js"
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

export interface TypeAliasDecl<
  Name extends string = string,
  T extends Type = Type,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: NodeKind["TypeAliasDecl"]
  type: Lazy<T>
  isDeprecated?: boolean
}

export interface SerializedTypeAliasDecl<
  Name extends string = string,
  T extends SerializedType = SerializedType,
  Params extends SerializedTypeParameter[] = SerializedTypeParameter[],
> extends SerializedBaseDecl<Name, Params> {
  kind: NodeKind["TypeAliasDecl"]
  type: T
  isDeprecated?: boolean
}

export const GenTypeAliasDecl = <
  Name extends string,
  T extends Type,
  Params extends TypeParameter[],
>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    isDeprecated?: boolean
    parameters: Params
    type: (...args: Params) => T
  },
): TypeAliasDecl<Name, T, Params> => {
  validateDeclName(options.name)

  const decl: TypeAliasDecl<Name, T, Params> = {
    ...options,
    kind: NodeKind.TypeAliasDecl,
    sourceUrl,
    type: Lazy.of(() => {
      const type = options.type(...options.parameters)
      type.parent = decl
      return type
    }),
  }

  return decl
}

export { GenTypeAliasDecl as GenTypeAlias }

export const TypeAliasDecl = <Name extends string, T extends Type>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    isDeprecated?: boolean
    type: () => T
  },
): TypeAliasDecl<Name, T, []> => {
  validateDeclName(options.name)

  const decl: TypeAliasDecl<Name, T, []> = {
    ...options,
    kind: NodeKind.TypeAliasDecl,
    sourceUrl,
    parameters: [],
    type: Lazy.of(() => {
      const type = options.type()
      type.parent = decl
      return type
    }),
  }

  return decl
}

export { TypeAliasDecl as TypeAlias }

export const isTypeAliasDecl = (node: Node): node is TypeAliasDecl<string, Type, TypeParameter[]> =>
  node.kind === NodeKind.TypeAliasDecl

export const getNestedDeclarationsInTypeAliasDecl: GetNestedDeclarations<TypeAliasDecl> = (
  addedDecls,
  decl,
) => getNestedDeclarations(addedDecls, decl.type.value)

export const validateTypeAliasDecl = <Params extends TypeParameter[]>(
  helpers: ValidatorHelpers,
  decl: TypeAliasDecl<string, Type, Params>,
  args: TypeArguments<Params>,
  value: unknown,
): Error[] =>
  validate(
    helpers,
    resolveTypeArgumentsInType(getTypeArgumentsRecord(decl, args), decl.type.value),
    value,
  )

export const resolveTypeArgumentsInTypeAliasDecl = <Params extends TypeParameter[]>(
  decl: TypeAliasDecl<string, Type, Params>,
  args: TypeArguments<Params>,
): TypeAliasDecl<string, Type, []> =>
  TypeAliasDecl(decl.sourceUrl, {
    ...decl,
    type: () => resolveTypeArgumentsInType(getTypeArgumentsRecord(decl, args), decl.type.value),
  })

export const serializeTypeAliasDecl: Serializer<TypeAliasDecl, SerializedTypeAliasDecl> = type => ({
  ...type,
  type: serializeType(type.type.value),
  parameters: type.parameters.map(param => serializeTypeParameter(param)),
})

export const getReferencesForTypeAliasDecl: GetReferences<TypeAliasDecl> = (decl, value) =>
  getReferencesForType(decl.type.value, value)
