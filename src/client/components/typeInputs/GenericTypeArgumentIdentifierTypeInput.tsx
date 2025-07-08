import { FunctionComponent } from "preact"
import { SerializedTypeArgumentType } from "../../../schema/types/references/TypeArgumentType.js"

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
