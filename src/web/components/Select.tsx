import type { FunctionalComponent } from "preact"

const isNullableString = (value: unknown): value is string | undefined => {
  return typeof value === "string" || value === undefined
}

export const Select: FunctionalComponent<preact.SelectHTMLAttributes> = props => (
  <div class="select-wrapper">
    <select
      {...props}
      class={`${(isNullableString(props.class) ? props.class : props.class.value) ?? ""} ${
        (isNullableString(props.className) ? props.className : props.className.value) ?? ""
      } ${!props.value ? "no-selection" : ""}`}
    />
  </div>
)
