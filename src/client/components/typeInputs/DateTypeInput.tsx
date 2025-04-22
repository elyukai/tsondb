import { FunctionComponent } from "preact"
import { SerializedDateType } from "../../../schema/types/primitives/DateType.js"
import { validateDateConstraints } from "../../../shared/validation/date.js"
import { ValidationErrors } from "./utils/ValidationErrors.js"

type Props = {
  type: SerializedDateType
  value: string
  onChange: (value: string) => void
}

export const DateTypeInput: FunctionComponent<Props> = ({ type, value, onChange }) => {
  const errors = validateDateConstraints(type, value)

  return (
    <div class="field">
      <input
        type="date"
        value={value}
        onInput={event => {
          onChange(event.currentTarget.value)
        }}
      />
      <ValidationErrors errors={errors} />
    </div>
  )
}
