import type { FunctionComponent } from "preact"
import { useState } from "preact/hooks"
import type { SerializedIntegerType } from "../../../shared/schema/types/IntegerType.ts"
import { validateNumberConstraints } from "../../../shared/validation/number.ts"
import type { TypeInputProps } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = TypeInputProps<SerializedIntegerType, number>

export const IntegerTypeInput: FunctionComponent<Props> = ({ type, value, disabled, onChange }) => {
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
          const numericValue = Number.parseInt(event.currentTarget.value, 10)
          if (!Number.isNaN(numericValue)) {
            onChange(numericValue)
          }
        }}
        step={0.01}
        aria-invalid={errors.length > 0}
        disabled={disabled}
      />
      <ValidationErrors errors={errors} />
    </div>
  )
}
