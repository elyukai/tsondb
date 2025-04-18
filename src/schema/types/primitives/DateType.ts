import { Node, NodeKind, Serializer } from "../../Node.js"
import { parallelizeErrors, Validator } from "../../validation/type.js"
import { BaseType, removeParentKey, SerializedBaseType } from "../Type.js"

export interface DateType extends BaseType {
  kind: NodeKind["DateType"]
}

export interface SerializedDateType extends SerializedBaseType {
  kind: NodeKind["DateType"]
}

export const DateType = (): DateType => ({
  kind: NodeKind.DateType,
})

export { DateType as Date }

export const isDateType = (node: Node): node is DateType => node.kind === NodeKind.DateType

export const validateDateType: Validator<DateType> = (_helpers, _type, value) => {
  if (typeof value !== "string") {
    return [TypeError(`expected a string, but got ${JSON.stringify(value)}`)]
  }

  return parallelizeErrors([
    isNaN(new Date(value).getTime())
      ? TypeError(`invalid ISO 8601 date string: ${value}`)
      : undefined,
  ])
}

export const serializeDateType: Serializer<DateType, SerializedDateType> = type =>
  removeParentKey(type)
