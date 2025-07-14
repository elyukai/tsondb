import { applyIndentation } from "./render.js"

export const getErrorMessageForDisplay = (error: Error): string => {
  if (error instanceof AggregateError) {
    return `${error.message}\n${applyIndentation(
      1,
      error.errors
        .filter(subError => subError instanceof Error)
        .map(subError => getErrorMessageForDisplay(subError))
        .join("\n"),
      2,
    )}`
  } else if (error.cause instanceof Error) {
    return `${error.message}\n${applyIndentation(1, getErrorMessageForDisplay(error.cause), 2)}`
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
