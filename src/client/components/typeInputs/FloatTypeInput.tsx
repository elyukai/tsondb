import { FunctionComponent } from "preact"
import { useState } from "preact/hooks"
import { SerializedFloatType } from "../../../schema/types/primitives/FloatType.js"
import { validateNumberConstraints } from "../../../shared/validation/number.js"
import { ValidationErrors } from "./utils/ValidationErrors.js"

type Props = {
  type: SerializedFloatType
  value: number
  onChange: (value: number) => void
}

export const FloatTypeInput: FunctionComponent<Props> = ({ type, value, onChange }) => {
  const [stringValue, setStringValue] = useState(value.toString())

  const errors = validateNumberConstraints(type, value)

  return (
    <div class="field">
      <input
        type="number"
        value={stringValue}
        onInput={event => {
          setStringValue(event.currentTarget.value)
          const numericValue = Number.parseFloat(event.currentTarget.value)
          if (!Number.isNaN(numericValue)) {
            onChange(numericValue)
          }
        }}
        step={0.01}
        aria-invalid={errors.length > 0}
      />
      <ValidationErrors errors={errors} />
    </div>
  )
}
