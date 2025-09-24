import type { FunctionComponent } from "preact"
import type { SerializedDateType } from "../../../shared/schema/types/DateType.ts"
import { validateDateConstraints } from "../../../shared/validation/date.ts"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = {
  type: SerializedDateType
  value: unknown
  onChange: (value: string) => void
}

export const DateTypeInput: FunctionComponent<Props> = ({ type, value, onChange }) => {
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
      />
      <ValidationErrors errors={errors} />
    </div>
  )
}
