import type { FunctionComponent } from "preact"
import type { SerializedDateType } from "../../../node/schema/types/primitives/DateType.ts"
import { validateDateConstraints } from "../../../shared/validation/date.ts"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

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
