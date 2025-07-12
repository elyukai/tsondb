import type { FunctionComponent } from "preact"
import type { SerializedIncludeIdentifierType } from "../../../node/schema/index.js"
import type { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.js"
import type { GetDeclFromDeclName } from "../../hooks/useSecondaryDeclarations.js"
import { TypeInput } from "./TypeInput.js"

type Props = {
  type: SerializedIncludeIdentifierType
  value: unknown
  instanceNamesByEntity: InstanceNamesByEntity
  getDeclFromDeclName: GetDeclFromDeclName
  onChange: (value: unknown) => void
}

export const IncludeIdentifierTypeInput: FunctionComponent<Props> = ({
  type,
  value,
  instanceNamesByEntity,
  getDeclFromDeclName,
  onChange,
}) => {
  const decl = getDeclFromDeclName(type.reference)

  if (decl === undefined) {
    return (
      <div role="alert">
        Unresolved declaration identifier <code>{type.reference}</code>
      </div>
    )
  }

  return (
    <TypeInput
      type={decl.type}
      value={value}
      instanceNamesByEntity={instanceNamesByEntity}
      getDeclFromDeclName={getDeclFromDeclName}
      onChange={onChange}
    />
  )
}
