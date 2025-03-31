import { Declaration } from "../../declarations/Declaration.js"
import { validateOption } from "../../validation/options.js"
import { ForeignKeyType } from "../references/ForeignKeyType.js"
import { Type } from "../Type.js"

export class ObjectType<T extends Record<string, ObjectKey<any, boolean>>> extends Type {
  properties: T
  additionalProperties?: boolean
  minProperties?: number
  maxProperties?: number
  patternProperties?: RegExp

  constructor(
    properties: T,
    options: {
      additionalProperties?: boolean
      minProperties?: number
      maxProperties?: number
      patternProperties?: RegExp
    } = {},
  ) {
    super()
    this.properties = properties
    this.additionalProperties = options.additionalProperties
    this.minProperties = validateOption(
      options.minProperties,
      "minProperties",
      (option) => Number.isInteger(option) && option >= 0,
    )
    this.maxProperties = validateOption(
      options.maxProperties,
      "maxProperties",
      (option) => Number.isInteger(option) && option >= 0,
    )
    this.patternProperties = options.patternProperties
  }

  getNestedDeclarations(): Declaration[] {
    return Object.values(this.properties).flatMap((prop) => {
      if (prop.type instanceof ObjectType) {
        return prop.type.getNestedDeclarations()
      } else if (prop.type instanceof ForeignKeyType) {
        return prop.type.entity.getNestedDeclarations()
      } else {
        return []
      }
    })
  }
}

export const _Object = <T extends Record<string, ObjectKey<any, boolean>>>(
  ...args: ConstructorParameters<typeof ObjectType<T>>
) => {
  return new ObjectType(...args)
}

export { _Object as Object }

export abstract class ObjectKey<T extends Type, R extends boolean> {
  public isRequired: R
  public type: T
  public comment?: string

  constructor(type: T, isRequired: R, comment?: string) {
    this.comment = comment
    this.type = type
    this.isRequired = isRequired
  }
}

export class RequiredKey<T extends Type> extends ObjectKey<T, true> {
  constructor(options: { comment?: string; type: T }) {
    super(options.type, true, options.comment)
  }
}

export const Required = <T extends Type>(...args: ConstructorParameters<typeof RequiredKey<T>>) => {
  return new RequiredKey(...args)
}

export class OptionalKey<T extends Type> extends ObjectKey<T, false> {
  constructor(options: { comment?: string; type: T }) {
    super(options.type, false, options.comment)
  }
}

export const Optional = <T extends Type>(...args: ConstructorParameters<typeof OptionalKey<T>>) => {
  return new OptionalKey(...args)
}
