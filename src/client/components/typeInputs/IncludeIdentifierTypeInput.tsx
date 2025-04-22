import { FunctionComponent } from "preact"
import { SerializedIncludeIdentifierType } from "../../../schema/index.js"
import { assertExhaustive } from "../../../shared/utils/typeSafety.js"
import { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.js"
import { GetDeclFromDeclName } from "../../hooks/useSecondaryDeclarations.js"
import { TypeInput } from "./TypeInput.js"
import { EnumDeclField } from "./utils/EnumDeclField.js"

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

  switch (decl.kind) {
    case "EnumDecl":
      return (
        <EnumDeclField
          decl={decl}
          value={value}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={onChange}
        />
      )

    case "TypeAliasDecl":
      return (
        <TypeInput
          type={decl.type}
          value={value}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={onChange}
        />
      )

    default:
      return assertExhaustive(decl)
  }
}
