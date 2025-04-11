import { applyIndentation } from "../renderers/utils.js"

export const getErrorMessageForDisplay = (error: Error): string => {
  if (error instanceof AggregateError) {
    return `${error.message}\n${applyIndentation(
      1,
      error.errors.map(subError => getErrorMessageForDisplay(subError)).join("\n"),
      2,
    )}`
  } else if (error.cause instanceof Error) {
    return `${error.message}\n${applyIndentation(1, getErrorMessageForDisplay(error.cause), 2)}`
  } else {
    return error.message
  }
}

export const wrapErrorsIfAny = (message: string, errors: Error[]): AggregateError | undefined => {
  if (errors.length === 0) {
    return undefined
  }

  return new AggregateError(errors, message)
}
