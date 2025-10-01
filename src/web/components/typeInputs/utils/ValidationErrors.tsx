import type { FunctionComponent } from "preact"

type Props = {
  disabled: boolean | undefined
  errors: Error[]
}

export const ValidationErrors: FunctionComponent<Props> = ({ disabled, errors }) =>
  disabled || errors.length === 0 ? null : (
    <div role="alert" class="validation-errors">
      <ul>
        {errors.map((error, i) => (
          <li key={i}>{error.message}</li>
        ))}
      </ul>
    </div>
  )
