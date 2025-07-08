import { FunctionalComponent } from "preact"
import { SelectHTMLAttributes } from "preact/compat"

export const Select: FunctionalComponent<SelectHTMLAttributes> = props => (
  <div class="select-wrapper">
    <select
      {...props}
      class={`${props.class ?? ""} ${props.className ?? ""} ${!props.value ? "no-selection" : ""}`}
    />
  </div>
)
