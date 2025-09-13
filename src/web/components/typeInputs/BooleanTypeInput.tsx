import type { FunctionComponent } from "preact"
import type { SerializedBooleanType } from "../../../node/schema/types/primitives/BooleanType.ts"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"

type Props = {
  type: SerializedBooleanType
  value: unknown
  onChange: (value: boolean) => void
}

export const BooleanTypeInput: FunctionComponent<Props> = ({ value, onChange }) => {
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
      />
    </div>
  )
}
