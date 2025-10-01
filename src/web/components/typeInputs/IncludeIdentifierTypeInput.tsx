import type { FunctionComponent } from "preact"
import type { SerializedIncludeIdentifierType } from "../../../shared/schema/types/IncludeIdentifierType.ts"
import { TypeInput, type TypeInputProps } from "./TypeInput.tsx"

type Props = TypeInputProps<SerializedIncludeIdentifierType>

export const IncludeIdentifierTypeInput: FunctionComponent<Props> = props => {
  const { type, getDeclFromDeclName } = props

  const decl = getDeclFromDeclName(type.reference)

  if (decl === undefined) {
    return (
      <div role="alert">
        Unresolved declaration identifier <code>{type.reference}</code>
      </div>
    )
  }

  return <TypeInput {...props} parentKey={undefined} type={decl.type} />
}
