import { FunctionComponent } from "preact"

type Props = {
  errors: Error[]
}

export const ValidationErrors: FunctionComponent<Props> = ({ errors }) => {
  return errors.length === 0 ? null : (
    <div role="alert" class="validation-errors">
      <ul>
        {errors.map((error, i) => (
          <li key={i}>{error.message}</li>
        ))}
      </ul>
    </div>
  )
}
