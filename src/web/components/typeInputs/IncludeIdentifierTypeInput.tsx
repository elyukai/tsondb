import type { FunctionComponent } from "preact"
import type { SerializedIncludeIdentifierType } from "../../../node/schema/index.ts"
import type { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.ts"
import type { GetDeclFromDeclName } from "../../hooks/useSecondaryDeclarations.ts"
import { TypeInput } from "./TypeInput.tsx"

type Props = {
  type: SerializedIncludeIdentifierType
  path: string | undefined
  value: unknown
  instanceNamesByEntity: InstanceNamesByEntity
  getDeclFromDeclName: GetDeclFromDeclName
  onChange: (value: unknown) => void
}

export const IncludeIdentifierTypeInput: FunctionComponent<Props> = ({
  type,
  path,
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
      path={path}
      value={value}
      instanceNamesByEntity={instanceNamesByEntity}
      getDeclFromDeclName={getDeclFromDeclName}
      onChange={onChange}
    />
  )
}
