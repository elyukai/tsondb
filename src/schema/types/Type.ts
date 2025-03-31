import { ArrayType } from "./generic/ArrayType.js"
import { ObjectType, OptionalKey, RequiredKey } from "./generic/ObjectType.js"
import { BooleanType } from "./primitives/BooleanType.js"
import { NumericType } from "./primitives/NumericType.js"
import { StringType } from "./primitives/StringType.js"

export class Type {}

type RequiredObjectKey<
  T extends ObjectType<any>,
  Key extends keyof T["properties"],
> = T["properties"][Key] extends RequiredKey<any> ? Key : never

type OptionalObjectKey<
  T extends ObjectType<any>,
  Key extends keyof T["properties"],
> = T["properties"][Key] extends OptionalKey<any> ? Key : never

export type TypeScriptType<T extends Type> = T extends ArrayType<any>
  ? Array<TypeScriptType<T["items"]>>
  : T extends ObjectType<any>
  ? {
      [K in keyof T["properties"] as RequiredObjectKey<
        T,
        K
      >]: T["properties"][K] extends RequiredKey<infer U> ? TypeScriptType<U> : never
    } & {
      [K in keyof T["properties"] as OptionalObjectKey<
        T,
        K
      >]?: T["properties"][K] extends OptionalKey<infer U> ? TypeScriptType<U> : never
    }
  : T extends NumericType
  ? number
  : T extends StringType
  ? string
  : T extends BooleanType
  ? boolean
  : never
