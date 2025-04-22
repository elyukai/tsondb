import { FunctionComponent } from "preact"
import { SerializedStringType } from "../../../schema/types/primitives/StringType.js"
import { validateStringConstraints } from "../../../shared/validation/string.js"
import { ValidationErrors } from "./utils/ValidationErrors.js"

type Props = {
  type: SerializedStringType
  value: string
  onChange: (value: string) => void
}

export const StringTypeInput: FunctionComponent<Props> = ({ type, value, onChange }) => {
  const { minLength, maxLength, pattern } = type

  const errors = validateStringConstraints(type, value)

  return (
    <div class="field">
      <input
        type="text"
        value={value}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        onInput={event => {
          onChange(event.currentTarget.value)
        }}
        aria-invalid={errors.length > 0}
      />
      <ValidationErrors errors={errors} />
    </div>
  )
}
