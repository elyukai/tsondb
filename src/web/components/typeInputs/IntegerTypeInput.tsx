import type { FunctionComponent } from "preact"
import { useState } from "preact/hooks"
import type { SerializedIntegerType } from "../../../node/schema/types/primitives/IntegerType.ts"
import { validateNumberConstraints } from "../../../shared/validation/number.ts"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = {
  type: SerializedIntegerType
  value: number
  onChange: (value: number) => void
}

export const IntegerTypeInput: FunctionComponent<Props> = ({ type, value, onChange }) => {
  const [stringValue, setStringValue] = useState(value.toString())

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
      />
      <ValidationErrors errors={errors} />
    </div>
  )
}
