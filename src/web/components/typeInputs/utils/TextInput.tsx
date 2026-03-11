import type { FunctionComponent, InputEventHandler } from "preact"

type Props = {
  type: "block" | "inline"
  value: string
  minLength?: number
  maxLength?: number
  disabled?: boolean
  onInput?: InputEventHandler<HTMLTextAreaElement | HTMLInputElement>
  "aria-invalid"?: boolean
}

export const TextInput: FunctionComponent<Props> = ({ type, ...props }) =>
  type === "block" ? <textarea {...props} rows={1} /> : <input type="text" />
