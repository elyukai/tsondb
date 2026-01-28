import { Lazy } from "@elyukai/utils/lazy"
import { onlyKeys } from "@elyukai/utils/object"
import type {
  NestedCustomConstraint,
  TypedNestedCustomConstraint,
} from "../../utils/customConstraints.ts"
import type {
  CustomConstraintValidator,
  GetNestedDeclarations,
  GetReferences,
  Predicate,
  Serializer,
  TypeArgumentsResolver,
  ValidationContext,
  ValidatorOfParamDecl,
} from "../Node.ts"
import {
  getNestedDeclarations,
  getReferences,
  NodeKind,
  resolveTypeArguments,
  serializeNode,
  validateType,
} from "../Node.ts"
import type { TypeParameter } from "../TypeParameter.ts"
import { serializeTypeParameter } from "../TypeParameter.ts"
import { checkCustomConstraintsInType, type Type } from "../types/Type.ts"
import type { BaseDecl, Decl, TypeArguments } from "./Declaration.ts"
import { getTypeArgumentsRecord, validateDeclName } from "./Declaration.ts"

export interface TypeAliasDecl<
  Name extends string = string,
  T extends Type = Type,
  Params extends TypeParameter[] = TypeParameter[],
> extends BaseDecl<Name, Params> {
  kind: NodeKind["TypeAliasDecl"]
  type: Lazy<T>
  isDeprecated?: boolean
  customConstraints?: NestedCustomConstraint
}

const TypeAliasDeclConstructor: {
  /**
   * Creates a new type alias declaration.
   * @param sourceUrl The source URL where the type alias is defined, usually `import.meta.url`.
   * @param options The options for the type alias declaration, including its name, comment, values, and custom constraints.
   * @returns A new `TypeAliasDecl` instance.
   */
  <Name extends string, T extends Type>(
    sourceUrl: string,
    options: {
      /**
       * The name of the type alias. The name must be unique within the schema.
       */
      name: Name
      /**
       * An optional comment describing the type alias.
       */
      comment?: string
      /**
       * If the type alias is deprecated. This may be rendered in the editor, generated types and generated documentation.
       */
      isDeprecated?: boolean
      /**
       * A builder for the type aliases type.
       */
      type: () => T
      /**
       * Custom validation logic. See {@link TypedNestedCustomConstraint} for more information.
       */
      customConstraints?: TypedNestedCustomConstraint<Name>
    },
  ): TypeAliasDecl<Name, T, []>
  /**
   * Creates a new generic type alias declaration.
   * @param sourceUrl The source URL where the type alias is defined, usually `import.meta.url`.
   * @param options The options for the type alias declaration, including its name, comment, parameters, values, and custom constraints.
   * @returns A new `TypeAliasDecl` instance.
   */
  <Name extends string, T extends Type, Params extends TypeParameter[]>(
    sourceUrl: string,
    options: {
      /**
       * The name of the type alias. The name must be unique within the schema.
       */
      name: Name
      /**
       * An optional comment describing the type alias.
       */
      comment?: string
      /**
       * The type parameters for the generic type alias.
       */
      parameters: Params
      /**
       * If the type alias is deprecated. This may be rendered in the editor, generated types and generated documentation.
       */
      isDeprecated?: boolean
      /**
       * A builder for the type aliases type.
       *
       * It received the type arguments and must return a type.
       */
      type: (...args: Params) => T
      /**
       * Custom validation logic. See {@link TypedNestedCustomConstraint} for more information.
       */
      customConstraints?: TypedNestedCustomConstraint<Name>
    },
  ): TypeAliasDecl<Name, T, Params>
} = <Name extends string, T extends Type, Params extends TypeParameter[]>(
  sourceUrl: string,
  options: {
    name: Name
    comment?: string
    parameters?: Params
    isDeprecated?: boolean
    type: (...args: Params) => T
    customConstraints?: TypedNestedCustomConstraint<Name>
  },
): TypeAliasDecl<Name, T, Params> => {
  validateDeclName(options.name)

  const parameters = (options.parameters ?? []) as Params
  const decl: TypeAliasDecl<Name, T, Params> = {
    ...onlyKeys(options, "name", "comment", "isDeprecated"),
    kind: NodeKind.TypeAliasDecl,
    sourceUrl,
    parameters,
    type: Lazy.of(() => options.type(...parameters)),
    customConstraints: options.customConstraints as NestedCustomConstraint | undefined, // ignore contravariance of registered type alias type
  }

  return decl
}

export const TypeAliasDecl: /**
 * Creates a new type alias declaration.
 * @param sourceUrl The source URL where the type alias is defined, usually `import.meta.url`.
 * @param options The options for the type alias declaration, including its name, comment, values, and custom constraints.
 * @returns A new `TypeAliasDecl` instance.
 */
<Name extends string, T extends Type>(
  sourceUrl: string,
  options: {
    /**
     * The name of the type alias. The name must be unique within the schema.
     */
    name: Name
    /**
     * An optional comment describing the type alias.
     */
    comment?: string
    /**
     * If the type alias is deprecated. This may be rendered in the editor, generated types and generated documentation.
     */
    isDeprecated?: boolean
    /**
     * A builder for the type aliases type.
     */
    type: () => T
    /**
     * Custom validation logic. See {@link TypedNestedCustomConstraint} for more information.
     */
    customConstraints?: TypedNestedCustomConstraint<Name>
  },
) => TypeAliasDecl<Name, T, []> = TypeAliasDeclConstructor

export { TypeAliasDecl as TypeAlias }

export const GenTypeAliasDecl: /**
 * Creates a new generic type alias declaration.
 * @param sourceUrl The source URL where the type alias is defined, usually `import.meta.url`.
 * @param options The options for the type alias declaration, including its name, comment, parameters, values, and custom constraints.
 * @returns A new `TypeAliasDecl` instance.
 */
<Name extends string, T extends Type, Params extends TypeParameter[]>(
  sourceUrl: string,
  options: {
    /**
     * The name of the type alias. The name must be unique within the schema.
     */
    name: Name
    /**
     * An optional comment describing the type alias.
     */
    comment?: string
    /**
     * The type parameters for the generic type alias.
     */
    parameters: Params
    /**
     * If the type alias is deprecated. This may be rendered in the editor, generated types and generated documentation.
     */
    isDeprecated?: boolean
    /**
     * A builder for the type aliases type.
     *
     * It received the type arguments and must return a type.
     */
    type: (...args: Params) => T
    /**
     * Custom validation logic. See {@link TypedNestedCustomConstraint} for more information.
     */
    customConstraints?: TypedNestedCustomConstraint<Name>
  },
) => TypeAliasDecl<Name, T, Params> = TypeAliasDeclConstructor

export { GenTypeAliasDecl as GenTypeAlias }

export const isTypeAliasDecl: Predicate<TypeAliasDecl> = node =>
  node.kind === NodeKind.TypeAliasDecl

export const getNestedDeclarationsInTypeAliasDecl: GetNestedDeclarations<TypeAliasDecl> = (
  addedDecls,
  decl,
) => getNestedDeclarations(addedDecls, decl.type.value, decl)

export const validateTypeAliasDecl = (<Params extends TypeParameter[]>(
  helpers: ValidationContext,
  inDecls: Decl[],
  decl: TypeAliasDecl<string, Type, Params>,
  args: TypeArguments<Params>,
  value: unknown,
) =>
  validateType(
    helpers,
    [...inDecls, decl],
    resolveTypeArguments(getTypeArgumentsRecord(decl, args), decl.type.value, [...inDecls, decl]),
    value,
  )) satisfies ValidatorOfParamDecl<TypeAliasDecl>

export const resolveTypeArgumentsInTypeAliasDecl: TypeArgumentsResolver<TypeAliasDecl> = (
  args,
  decl,
  inDecl,
) =>
  TypeAliasDecl(decl.sourceUrl, {
    ...decl,
    type: () => resolveTypeArguments(args, decl.type.value, [...inDecl, decl]),
    customConstraints: decl.customConstraints as TypedNestedCustomConstraint<string> | undefined, // ignore contravariance of registered type alias type
  })

export const serializeTypeAliasDecl: Serializer<TypeAliasDecl> = type => ({
  ...type,
  type: serializeNode(type.type.value),
  parameters: type.parameters.map(param => serializeTypeParameter(param)),
  customConstraints: type.customConstraints !== undefined,
})

export const getReferencesForTypeAliasDecl: GetReferences<TypeAliasDecl> = (decl, value, inDecl) =>
  getReferences(decl.type.value, value, [...inDecl, decl])

export const checkCustomConstraintsInTypeAliasDecl: CustomConstraintValidator<TypeAliasDecl> = (
  decl,
  value,
  helpers,
) =>
  (decl.customConstraints?.({ ...helpers, value }) ?? []).concat(
    checkCustomConstraintsInType(decl.type.value, value, helpers),
  )
