import { Declaration } from "../../declarations/Declaration.js"
import { validateOption } from "../../validation/options.js"
import { ForeignKeyType } from "../references/ForeignKeyType.js"
import { Type } from "../Type.js"

export class ObjectType<T extends Record<string, ObjectKey<any, boolean>>> extends Type {
  properties: T
  additionalProperties?: boolean
  minProperties?: number
  maxProperties?: number

  constructor(
    properties: T,
    options: {
      additionalProperties?: boolean
      minProperties?: number
      maxProperties?: number
    } = {},
  ) {
    super()
    this.properties = properties
    this.additionalProperties = options.additionalProperties
    this.minProperties = validateOption(
      options.minProperties,
      "minProperties",
      option => Number.isInteger(option) && option >= 0,
    )
    this.maxProperties = validateOption(
      options.maxProperties,
      "maxProperties",
      option => Number.isInteger(option) && option >= 0,
    )
  }

  getNestedDeclarations(): Declaration[] {
    return Object.values(this.properties).flatMap(prop => {
      if (prop.type instanceof ObjectType) {
        return prop.type.getNestedDeclarations()
      } else if (prop.type instanceof ForeignKeyType) {
        return [prop.type.entity, ...prop.type.entity.getNestedDeclarations()]
      } else {
        return []
      }
    })
  }

  validate(value: unknown): void {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new TypeError(`Expected an object, but got ${JSON.stringify(value)}`)
    }

    const keys = Object.keys(this.properties)
    if (this.minProperties !== undefined && keys.length < this.minProperties) {
      throw new RangeError(
        `Expected at least ${this.minProperties} propert${
          this.minProperties === 1 ? "y" : "ies"
        }, but got ${keys.length} propert${keys.length === 1 ? "y" : "ies"}`,
      )
    }

    if (this.maxProperties !== undefined && keys.length > this.maxProperties) {
      throw new RangeError(
        `Expected at most ${this.maxProperties} propert${
          this.maxProperties === 1 ? "y" : "ies"
        }, but got ${keys.length} propert${keys.length === 1 ? "y" : "ies"}`,
      )
    }

    for (const key of keys) {
      const prop = this.properties[key]!
      if (!(key in value)) {
        if (prop.isRequired) {
          throw new TypeError(`Missing required property: ${key}`)
        }
      } else {
        try {
          prop.type.validate((value as Record<string, unknown>)[key])
        } catch (error) {
          throw new TypeError(`at object key "${key}"`, { cause: error })
        }
      }
    }
  }

  replaceTypeArguments(
    args: Record<string, Type>,
  ): ObjectType<Record<string, ObjectKey<Type, boolean>>> {
    return new ObjectType(
      Object.fromEntries(
        Object.entries(this.properties).map(
          ([key, config]) => [key, config.type.replaceTypeArguments(args)] as const,
        ),
      ),
      {
        ...this,
      },
    )
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
