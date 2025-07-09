import { parallelizeErrors } from "../utils/validation.js"

export interface StringConstraints {
  minLength?: number
  maxLength?: number
  pattern?: string | RegExp
}

export const validateStringConstraints = (constraints: StringConstraints, value: string) =>
  parallelizeErrors([
    constraints.minLength !== undefined && value.length < constraints.minLength
      ? RangeError(
          `expected a string with at least ${constraints.minLength.toString()} character${
            constraints.minLength === 1 ? "" : "s"
          }, but got ${value.length.toString()} character${value.length === 1 ? "" : "s"}`,
        )
      : undefined,
    constraints.maxLength !== undefined && value.length > constraints.maxLength
      ? RangeError(
          `expected a string with at most ${constraints.maxLength.toString()} character${
            constraints.maxLength === 1 ? "" : "s"
          }, but got ${value.length.toString()} character${value.length === 1 ? "" : "s"}`,
        )
      : undefined,
    (() => {
      if (constraints.pattern === undefined) {
        return undefined
      }

      const pattern =
        typeof constraints.pattern === "string"
          ? new RegExp(constraints.pattern)
          : constraints.pattern

      return !pattern.test(value)
        ? TypeError(`string does not match the pattern ${pattern.toString()}`)
        : undefined
    })(),
  ])
