import { FunctionComponent } from "preact"
import { SerializedGenericArgumentIdentifierType } from "../../../schema/types/references/GenericArgumentIdentifierType.js"

type Props = {
  type: SerializedGenericArgumentIdentifierType
}

export const GenericArgumentIdentifierTypeInput: FunctionComponent<Props> = ({ type }) => {
  return (
    <div role="alert">
      Unresolved type argument <code>{type.argument.name}</code>
    </div>
  )
}
