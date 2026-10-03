import type { Response } from "express"
import { getErrorMessageForDisplay, HTTPError } from "../../shared/utils/error.ts"

export const sendErrorResponse = (res: Response, error: unknown): void => {
  res.set("Content-Type", "text/plain")
  if (error instanceof HTTPError) {
    res.status(error.code).send(error.message)
  } else if (error instanceof Error) {
    res.status(500).send(getErrorMessageForDisplay(error))
  } else {
    res.status(500).send(String(error))
  }
}
