import { parallelizeErrors } from "../utils/validation.ts"

export interface DateConstraints {
  time?: boolean
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

const isValidISODateString = (dateString: string) => !isNaN(new Date(dateString).getTime())

export const validateDateConstraints = (constraints: DateConstraints, value: string) =>
  parallelizeErrors([
    constraints.time === true
      ? dateTimePattern.test(value) && isValidISODateString(value)
        ? undefined
        : TypeError(`invalid ISO 8601 date time string: ${value}`)
      : datePattern.test(value) && isValidISODateString(value)
        ? undefined
        : TypeError(`invalid ISO 8601 date-only string: ${value}`),
  ])
