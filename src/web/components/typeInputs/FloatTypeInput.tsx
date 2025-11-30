import type { FunctionComponent } from "preact"
import { useState } from "preact/hooks"
import {
  DEFAULT_FRACTION_DIGITS,
  type SerializedFloatType,
} from "../../../shared/schema/types/FloatType.ts"
import { validateNumberConstraints } from "../../../shared/validation/number.ts"
import type { TypeInputProps } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = TypeInputProps<SerializedFloatType, number>

export const FloatTypeInput: FunctionComponent<Props> = ({ type, value, disabled, onChange }) => {
  const [stringValue, setStringValue] = useState(typeof value === "number" ? value.toString() : "")

  if (typeof value !== "number") {
    return <MismatchingTypeError expected="float" actual={value} />
  }

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
        step={1 / Math.pow(10, type.fractionDigits ?? DEFAULT_FRACTION_DIGITS)}
        aria-invalid={errors.length > 0}
        disabled={disabled}
      />
      <ValidationErrors disabled={disabled} errors={errors} />
    </div>
  )
}
