import type { FunctionComponent } from "preact"

type Props = {
  expected: string
  actual: unknown
}

export const MismatchingTypeError: FunctionComponent<Props> = ({ expected, actual }) => {
  return (
    <div role="alert">
      Expected value of type {expected}, but got{" "}
      <code>{actual === undefined ? "undefined" : JSON.stringify(actual)}</code>
    </div>
  )
}
