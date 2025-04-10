import { applyIndentation } from "../renderers/utils.js"

export const getErrorMessageForDisplay = (error: Error): string => {
  if (error.cause) {
    return `${error.message}\n${applyIndentation(1, getErrorMessageForDisplay(error), 2)}`
  } else {
    return error.message
  }
}
