import { Lazy } from "@elyukai/utils/lazy"
import { onlyKeys } from "@elyukai/utils/object"
import { NodeKind } from "../../../../shared/schema/Node.js"
import type {
  NestedCustomConstraint,
  TypedNestedCustomConstraint,
} from "../../../utils/customConstraints.ts"
import type { Node } from "../index.ts"
import type { TypeParameter } from "../TypeParameter.ts"
import type { Type } from "../types/Type.ts"
import type { BaseDecl } from "./Decl.ts"
import { validateDeclName } from "./Decl.ts"

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

export const isTypeAliasDecl = (node: Node): node is TypeAliasDecl =>
  node.kind === NodeKind.TypeAliasDecl
