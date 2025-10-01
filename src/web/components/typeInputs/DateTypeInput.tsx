import type { FunctionComponent } from "preact"
import type { SerializedDateType } from "../../../shared/schema/types/DateType.ts"
import { validateDateConstraints } from "../../../shared/validation/date.ts"
import type { TypeInputProps } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = TypeInputProps<SerializedDateType, string>

export const DateTypeInput: FunctionComponent<Props> = ({ type, value, disabled, onChange }) => {
  if (typeof value !== "string") {
    return <MismatchingTypeError expected="date string" actual={value} />
  }

  const errors = validateDateConstraints(type, value)

  return (
    <div class="field">
      <input
        type="date"
        value={value}
        onInput={event => {
          onChange(event.currentTarget.value)
        }}
        disabled={disabled}
      />
      <ValidationErrors errors={errors} />
    </div>
  )
}
