import type { FunctionalComponent } from "preact"
import type { SelectHTMLAttributes } from "preact/compat"

const isNullableString = (value: unknown): value is string | undefined => {
  return typeof value === "string" || value === undefined
}

export const Select: FunctionalComponent<SelectHTMLAttributes> = props => (
  <div class="select-wrapper">
    <select
      {...props}
      class={`${(isNullableString(props.class) ? props.class : props.class.value) ?? ""} ${
        (isNullableString(props.className) ? props.className : props.className.value) ?? ""
      } ${!props.value ? "no-selection" : ""}`}
    />
  </div>
)
