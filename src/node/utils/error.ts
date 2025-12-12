import { applyIndentation } from "./render.ts"
import { UniqueConstraintError } from "./unique.ts"

export const getErrorMessageForDisplay = (error: Error, indentation = 2): string => {
  if (error instanceof AggregateError) {
    return `${error.message}\n${applyIndentation(
      1,
      error.errors
        .filter(subError => subError instanceof Error)
        .map(subError => getErrorMessageForDisplay(subError, indentation))
        .join("\n"),
      indentation,
    )}`
  } else if (error.cause instanceof Error) {
    return `${error.message}\n${applyIndentation(1, getErrorMessageForDisplay(error.cause, indentation), indentation)}`
  } else if (error instanceof UniqueConstraintError) {
    return `${error.message}\n${applyIndentation(1, error.parts.join("\n"), indentation)}`
  } else {
    return error.message
  }
}

export const countError = (error: Error): number =>
  error instanceof AggregateError
    ? countErrors(error.errors.filter(subError => subError instanceof Error))
    : error.cause instanceof Error
      ? countError(error.cause)
      : 1

export const countErrors = (errors: Error[]): number =>
  errors.reduce((count, error) => count + countError(error), 0)

export const wrapErrorsIfAny = (message: string, errors: Error[]): AggregateError | undefined => {
  if (errors.length === 0) {
    return undefined
  }

  return new AggregateError(errors, message)
}

export class HTTPError extends Error {
  public code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.name = "HTTPError"
  }
}
