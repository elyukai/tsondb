import type { FunctionComponent } from "preact"
import type { SerializedBooleanType } from "../../../shared/schema/types/BooleanType.ts"
import type { TypeInputProps } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"

type Props = TypeInputProps<SerializedBooleanType, boolean>

export const BooleanTypeInput: FunctionComponent<Props> = ({ value, disabled, onChange }) => {
  if (typeof value !== "boolean") {
    return <MismatchingTypeError expected="boolean" actual={value} />
  }

  return (
    <div class="field">
      <input
        type="checkbox"
        checked={value}
        onInput={event => {
          onChange(event.currentTarget.checked)
        }}
        disabled={disabled}
      />
    </div>
  )
}
