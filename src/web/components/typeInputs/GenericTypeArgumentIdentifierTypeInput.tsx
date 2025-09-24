import type { FunctionComponent } from "preact"
import type { SerializedTypeArgumentType } from "../../../shared/schema/types/TypeArgumentType.ts"

type Props = {
  type: SerializedTypeArgumentType
}

export const TypeArgumentTypeInput: FunctionComponent<Props> = ({ type }) => {
  return (
    <div role="alert">
      Unresolved type argument <code>{type.argument.name}</code>
    </div>
  )
}
