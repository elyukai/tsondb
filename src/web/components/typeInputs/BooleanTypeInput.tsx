import { FunctionComponent } from "preact"
import { SerializedBooleanType } from "../../../node/schema/types/primitives/BooleanType.js"

type Props = {
  type: SerializedBooleanType
  value: boolean
  onChange: (value: boolean) => void
}

export const BooleanTypeInput: FunctionComponent<Props> = ({ value, onChange }) => {
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
