import { EOL } from "node:os"
import { Declaration } from "../../schema/declarations/Declaration.js"
import { EntityDeclaration } from "../../schema/declarations/EntityDeclaration.js"
import { EnumDeclaration } from "../../schema/declarations/EnumDeclaration.js"
import { TypeAliasDeclaration } from "../../schema/declarations/TypeAliasDeclaration.js"
import { TypeParameter } from "../../schema/parameters/TypeParameter.js"
import { ArrayType } from "../../schema/types/generic/ArrayType.js"
import { ObjectKey, ObjectType } from "../../schema/types/generic/ObjectType.js"
import { BooleanType } from "../../schema/types/primitives/BooleanType.js"
import { FloatType } from "../../schema/types/primitives/FloatType.js"
import { IntegerType } from "../../schema/types/primitives/IntegerType.js"
import { NumericType } from "../../schema/types/primitives/NumericType.js"
import { StringType } from "../../schema/types/primitives/StringType.js"
import { ArgumentType } from "../../schema/types/references/ArgumentType.js"
import { ForeignKeyType } from "../../schema/types/references/ForeignKeyType.js"
import { ReferenceType } from "../../schema/types/references/ReferenceType.js"
import { Type } from "../../schema/types/Type.js"
import { applyIndentation, joinSyntax, prefixLines } from "../utils.js"

export class TypeScriptRenderer {
  indentation: number

  constructor(options: { indentation?: number } = {}) {
    this.indentation = options.indentation ?? 2
  }

  renderDeclarations(declarations: Declaration[]): string {
    return declarations.map(decl => this.renderDeclaration(decl)).join(EOL + EOL)
  }

  renderDocumentation = (comment?: string): string =>
    comment === undefined
      ? ""
      : joinSyntax("/**", EOL, prefixLines(" * ", comment, true), EOL, " */", EOL)

  renderDeclaration<T extends Declaration>(decl: T): string {
    if (decl instanceof EntityDeclaration) {
      return this.renderEntityDeclaration(decl)
    } else if (decl instanceof EnumDeclaration) {
      return this.renderEnumDeclaration(decl)
    } else if (decl instanceof TypeAliasDeclaration) {
      return this.renderTypeAliasDeclaration(decl)
    }

    throw new Error(`Unknown declaration: ${decl.constructor.name}`)
  }

  renderTypeParameters(params: TypeParameter[]): string {
    return params.length === 0
      ? ""
      : `<${params
          .map(param =>
            param.constraint === undefined
              ? param.name
              : joinSyntax(param.name, " extends ", this.renderType(param.constraint)),
          )
          .join(", ")}>`
  }

  renderEntityDeclaration<
    Name extends string,
    T extends ObjectType<any>,
    PK extends keyof T["properties"],
  >(decl: EntityDeclaration<Name, T, PK>): string {
    return joinSyntax(
      this.renderDocumentation(decl.comment),
      "export interface ",
      decl.name,
      this.renderTypeParameters(decl.parameters),
      " ",
      this.renderType(decl.type),
    )
  }

  renderEnumDeclaration<Name extends string>(decl: EnumDeclaration<Name>): string {
    return joinSyntax(
      this.renderDocumentation(decl.comment),
      "export type ",
      decl.name,
      this.renderTypeParameters(decl.parameters),
      " = ",
      "???",
    )
  }

  renderTypeAliasDeclaration<Name extends string, T extends ObjectType<any>>(
    decl: TypeAliasDeclaration<Name, T>,
  ): string {
    return joinSyntax(
      this.renderDocumentation(decl.comment),
      "export type ",
      decl.name,
      this.renderTypeParameters(decl.parameters),
      " = ",
      this.renderType(decl.type),
    )
  }

  renderArrayType<T extends Type>(type: ArrayType<T>): string {
    return `${this.renderType(type.items)}[]`
  }

  renderObjectType<T extends Record<string, ObjectKey<any, boolean>>>(type: ObjectType<T>): string {
    return joinSyntax(
      "{",
      EOL,
      applyIndentation(
        1,
        Object.entries(type.properties)
          .map(([name, config]) =>
            joinSyntax(
              this.renderDocumentation(config.comment),
              name,
              config.isRequired ? "" : "?",
              ": ",
              this.renderType(config.type),
            ),
          )
          .join(EOL + EOL),
        this.indentation,
      ),
      EOL,
      "}",
    )
  }

  renderBooleanType(_type: BooleanType): string {
    return "boolean"
  }

  renderNumericType(_type: NumericType): string {
    return "number"
  }

  renderStringType(_type: StringType): string {
    return "string"
  }

  renderArgumentType<T extends TypeParameter>(type: ArgumentType<T>): string {
    return type.argument.name
  }

  renderForeignKeyType<T extends EntityDeclaration<string, ObjectType<any>, string>>(
    type: ForeignKeyType<T>,
  ): string {
    return joinSyntax(
      "{",
      EOL,
      applyIndentation(
        1,
        joinSyntax(
          'entity: "',
          type.entity.name,
          '"',
          EOL,
          "entityIdentifier: {",
          EOL,
          applyIndentation(
            1,
            type.entity.primaryKey
              .map(key =>
                joinSyntax(key, ": ", this.renderType(type.entity.type.properties[key].type)),
              )
              .join(EOL),
            this.indentation,
          ),
          EOL,
          "}",
        ),
        this.indentation,
      ),
      EOL,
      "}",
    )
  }

  renderReferenceType<T extends TypeAliasDeclaration<string, ObjectType<any>>>(
    type: ReferenceType<T>,
  ): string {
    return type.reference.name
  }

  renderType<T extends Type>(type: T): string {
    if (type instanceof ArrayType) {
      return this.renderArrayType(type)
    } else if (type instanceof ObjectType) {
      return this.renderObjectType(type)
    } else if (type instanceof BooleanType) {
      return this.renderBooleanType(type)
    } else if (type instanceof FloatType) {
      return this.renderNumericType(type)
    } else if (type instanceof IntegerType) {
      return this.renderNumericType(type)
    } else if (type instanceof StringType) {
      return this.renderStringType(type)
    } else if (type instanceof ArgumentType) {
      return this.renderArgumentType(type)
    } else if (type instanceof ForeignKeyType) {
      return this.renderForeignKeyType(type)
    } else if (type instanceof ReferenceType) {
      return this.renderReferenceType(type)
    }

    throw new Error(`Unknown type: ${type.constructor.name}`)
  }
}
